import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func, or_
from .enums import UserRole
from .models import (
    Product, Category, Cart, CartItem,
    ProductImage, Order, OrderItem
)
from .extensions import db
from .middleware import role_required, session_required
from .media_utils import allowed_file, save_image_and_thumbnail, save_image_and_thumbnail_s3, delete_file_if_exists
from .s3_utils import delete_s3_key, public_url_for_key
shop_bp = Blueprint("shop", __name__, url_prefix="/api")


def _product_image_urls(image):
    if current_app.config.get("USE_S3"):
        return {
            "image_url": public_url_for_key(f"products/{image.image_path}"),
            "thumbnail_url": public_url_for_key(f"thumbnails/{image.thumbnail_path}"),
        }
    base_url = request.host_url.rstrip("/")
    return {
        "image_url": f"{base_url}/media/products/{image.image_path}",
        "thumbnail_url": f"{base_url}/media/thumbnails/{image.thumbnail_path}",
    }


def product_to_dict(product):
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "stock": product.stock,
        "category_id": product.category_id,
        "category": product.category.name if product.category else None,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "images": [
            {
                "id": image.id,
                **_product_image_urls(image),
            }
            for image in product.images
        ]
    }


def cart_item_to_dict(item):
    thumbnail_url = None
    if item.product and item.product.images:
        thumbnail_url = _product_image_urls(item.product.images[0])["thumbnail_url"]
    return {
        "id": item.id,
        "product_id": item.product_id,
        "product_name": item.product.name if item.product else None,
        "price": item.product.price if item.product else None,
        "quantity": item.quantity,
        "line_total": (item.product.price * item.quantity) if item.product else 0,
        "thumbnail_url": thumbnail_url
    }


@shop_bp.route("/categories", methods=["POST"])
@role_required(UserRole.ADMIN)
def create_category():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "category name is required"}), 400
    existing_category = Category.query.filter(
        func.lower(Category.name) == name.lower()
    ).first()
    if existing_category:
        return jsonify({"error": "category already exists"}), 409
    category = Category(name=name)
    db.session.add(category)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to create category"}), 500

    return jsonify({
        "message": "Category created",
        "category": {"id": category.id, "name": category.name}
    }), 201


@shop_bp.route("/categories", methods=["GET"])
def get_categories():
    categories = Category.query.order_by(Category.name.asc()).all()
    result = [{"id": c.id, "name": c.name} for c in categories]
    return jsonify(result), 200


@shop_bp.route("/products", methods=["POST"])
@role_required(UserRole.ADMIN)
def create_product():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    price = data.get("price")
    stock = data.get("stock")
    category_id = data.get("category_id")
    if not name:
        return jsonify({"error": "product name is required"}), 400
    if price is None or stock is None or category_id is None:
        return jsonify({"error": "price, stock and category_id are required"}), 400

    try:
        price = float(price)
        stock = int(stock)
        category_id = int(category_id)
    except (TypeError, ValueError):
        return jsonify({"error": "invalid price, stock or category_id"}), 400

    if price < 0 or stock < 0:
        return jsonify({"error": "price and stock cannot be negative"}), 400
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"error": "category not found"}), 404

    product = Product(
        name=name,
        description=description,
        price=price,
        stock=stock,
        category_id=category_id
    )
    db.session.add(product)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to create product"}), 500

    return jsonify({
        "message": "Product created",
        "product": product_to_dict(product)
    }), 201


@shop_bp.route("/products/<int:product_id>/images", methods=["POST"])
@role_required(UserRole.ADMIN)
def upload_product_images(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "product not found"}), 404
    files = request.files.getlist("images")
    if not files:
        return jsonify({"error": "no images uploaded"}), 400
    uploaded = []

    for file in files:
        if not file or not file.filename:
            continue
        if not allowed_file(file.filename, current_app.config["ALLOWED_IMAGE_EXTENSIONS"]):
            return jsonify({"error": f"invalid image type for {file.filename}"}), 400
        try:
            if current_app.config.get("USE_S3"):
                image_name, thumb_name = save_image_and_thumbnail_s3(
                    file,
                    current_app.config["THUMBNAIL_SIZE"],
                )
            else:
                image_name, thumb_name = save_image_and_thumbnail(
                    file,
                    current_app.config["UPLOAD_FOLDER"],
                    current_app.config["THUMBNAIL_FOLDER"],
                    current_app.config["THUMBNAIL_SIZE"],
                )
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            current_app.logger.error(f"Image processing error: {str(e)}", exc_info=True)
            return jsonify({"error": "failed to process image", "details": str(e)}), 500

        product_image = ProductImage(
            product_id=product.id,
            image_path=image_name,
            thumbnail_path=thumb_name,
            original_filename=file.filename
        )
        db.session.add(product_image)
        uploaded.append(product_image)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Database error saving images: {str(e)}", exc_info=True)
        return jsonify({"error": "failed to save image records", "details": str(e)}), 500
    return jsonify({
        "message": "Images uploaded successfully",
        "images": [
            {
                "id": img.id,
                **_product_image_urls(img),
            }
            for img in uploaded
        ]
    }), 201


@shop_bp.route("/products", methods=["GET"])
def get_products():
    search = request.args.get("search", "").strip()
    category_id = request.args.get("category_id")
    min_price = request.args.get("min_price")
    max_price = request.args.get("max_price")
    sort_by = request.args.get("sort_by", "newest").strip().lower()
    order = request.args.get("order", "desc").strip().lower()
    page = request.args.get("page", 1)
    per_page = request.args.get("per_page", 5)
    query = Product.query.join(Category)
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%")
            )
        )
    if category_id:
        try:
            category_id = int(category_id)
            query = query.filter(Product.category_id == category_id)
        except ValueError:
            return jsonify({"error": "category_id must be an integer"}), 400
    if min_price:
        try:
            min_price = float(min_price)
            query = query.filter(Product.price >= min_price)
        except ValueError:
            return jsonify({"error": "min_price must be a number"}), 400

    if max_price:
        try:
            max_price = float(max_price)
            query = query.filter(Product.price <= max_price)
        except ValueError:
            return jsonify({"error": "max_price must be a number"}), 400

    if sort_by == "price":
        query = query.order_by(Product.price.asc() if order == "asc" else Product.price.desc())
    elif sort_by == "newest":
        query = query.order_by(Product.created_at.asc() if order == "asc" else Product.created_at.desc())
    else:
        return jsonify({"error": "invalid sort_by. use price or newest"}), 400

    try:
        page = int(page)
        per_page = int(per_page)
    except ValueError:
        return jsonify({"error": "page and per_page must be integers"}), 400

    if page < 1 or per_page < 1:
        return jsonify({"error": "page and per_page must be positive"}), 400

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "products": [product_to_dict(product) for product in pagination.items],
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total_items": pagination.total,
            "total_pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        }
    }), 200

@shop_bp.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = Product.query.get(product_id)

    if not product:
        return jsonify({"error": "product not found"}), 404

    return jsonify(product_to_dict(product)), 200

@shop_bp.route("/products/<int:product_id>", methods=["PUT"])
@role_required(UserRole.ADMIN)
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "product not found"}), 404
    data = request.get_json() or {}
    if "name" in data:
        name = str(data.get("name", "")).strip()
        if not name:
            return jsonify({"error": "name cannot be empty"}), 400
        product.name = name
    if "description" in data:
        product.description = str(data.get("description", "")).strip()
    if "price" in data:
        try:
            price = float(data.get("price"))
            if price < 0:
                return jsonify({"error": "price cannot be negative"}), 400
            product.price = price
        except (TypeError, ValueError):
            return jsonify({"error": "price must be a number"}), 400
    if "stock" in data:
        try:
            stock = int(data.get("stock"))
            if stock < 0:
                return jsonify({"error": "stock cannot be negative"}), 400
            product.stock = stock
        except (TypeError, ValueError):
            return jsonify({"error": "stock must be an integer"}), 400
    if "category_id" in data:
        try:
            category_id = int(data.get("category_id"))
        except (TypeError, ValueError):
            return jsonify({"error": "category_id must be an integer"}), 400

        category = Category.query.get(category_id)
        if not category:
            return jsonify({"error": "category not found"}), 404

        product.category_id = category_id
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to update product"}), 500
    return jsonify({
        "message": "Product updated",
        "product": product_to_dict(product)
    }), 200


@shop_bp.route("/products/<int:product_id>", methods=["DELETE"])
@role_required(UserRole.ADMIN)
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "product not found"}), 404
    for image in product.images:
        if current_app.config.get("USE_S3"):
            delete_s3_key(f"products/{image.image_path}")
            delete_s3_key(f"thumbnails/{image.thumbnail_path}")
        else:
            delete_file_if_exists(os.path.join(current_app.config["UPLOAD_FOLDER"], image.image_path))
            delete_file_if_exists(os.path.join(current_app.config["THUMBNAIL_FOLDER"], image.thumbnail_path))
    db.session.delete(product)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to delete product"}), 500
    return jsonify({"message": "Product deleted"}), 200


@shop_bp.route("/cart", methods=["GET"])
@session_required
def get_my_cart():
    user_id = int(get_jwt_identity())
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        return jsonify({"error": "cart not found"}), 404
    items = [cart_item_to_dict(item) for item in cart.items]
    total_amount = sum(item["line_total"] for item in items)
    return jsonify({
        "cart_id": cart.id,
        "user_id": cart.user_id,
        "items": items,
        "total_amount": total_amount
    }), 200


@shop_bp.route("/cart/items", methods=["POST"])
@session_required
def add_to_cart():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)
    try:
        product_id = int(product_id)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({"error": "product_id and quantity must be integers"}), 400
    if quantity < 1:
        return jsonify({"error": "quantity must be at least 1"}), 400
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        return jsonify({"error": "cart not found"}), 404
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "product not found"}), 404
    if product.stock < quantity:
        return jsonify({"error": "insufficient stock"}), 400
    existing_item = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()
    if existing_item:
        new_quantity = existing_item.quantity + quantity
        if product.stock < new_quantity:
            return jsonify({"error": "insufficient stock for updated quantity"}), 400
        existing_item.quantity = new_quantity
    else:
        cart_item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
        db.session.add(cart_item)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to add item to cart"}), 500
    return jsonify({"message": "Item added to cart"}), 201

@shop_bp.route("/cart/items/<int:item_id>", methods=["PUT"])
@session_required
def update_cart_item(item_id):
    user_id = int(get_jwt_identity())
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        return jsonify({"error": "cart not found"}), 404
    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return jsonify({"error": "cart item not found"}), 404
    data = request.get_json() or {}
    quantity = data.get("quantity")
    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({"error": "quantity must be an integer"}), 400
    if quantity < 1:
        return jsonify({"error": "quantity must be at least 1"}), 400
    if item.product.stock < quantity:
        return jsonify({"error": "insufficient stock"}), 400
    item.quantity = quantity
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to update cart item"}), 500
    return jsonify({"message": "Cart item updated"}), 200


@shop_bp.route("/cart/items/<int:item_id>", methods=["DELETE"])
@session_required
def remove_cart_item(item_id):
    user_id = int(get_jwt_identity())
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        return jsonify({"error": "cart not found"}), 404
    item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        return jsonify({"error": "cart item not found"}), 404
    db.session.delete(item)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to remove cart item"}), 500
    return jsonify({"message": "Cart item removed"}), 200


@shop_bp.route("/checkout", methods=["POST"])
@session_required
def checkout():
    user_id = int(get_jwt_identity())
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        return jsonify({"error": "cart not found"}), 404
    if not cart.items:
        return jsonify({"error": "cart is empty"}), 400
    total_amount = 0
    for item in cart.items:
        if item.product.stock < item.quantity:
            return jsonify({
                "error": f"insufficient stock for product {item.product.name}"
            }), 400

    order = Order(user_id=user_id, total_amount=0, status="placed")
    db.session.add(order)
    db.session.flush()
    for item in cart.items:
        line_total = item.product.price * item.quantity
        total_amount += line_total
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_purchase=item.product.price
        )
        db.session.add(order_item)
        item.product.stock -= item.quantity
    order.total_amount = total_amount
    for item in list(cart.items):
        db.session.delete(item)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "failed to checkout"}), 500
    return jsonify({
        "message": "order placed successfully",
        "order_id": order.id,
        "total_amount": order.total_amount
    }), 201

@shop_bp.route("/orders", methods=["GET"])
@session_required
def get_orders():
    user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    result = []
    for order in orders:
        result.append({
            "order_id": order.id,
            "status": order.status,
            "total_amount": order.total_amount,
            "created_at": order.created_at.isoformat(),
            "items": [
                {
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "price_at_purchase": item.price_at_purchase
                }
                for item in order.items
            ]
        })
    return jsonify(result), 200


@shop_bp.route("/analytics/product-count-by-category", methods=["GET"])
@role_required(UserRole.ADMIN)
def product_count_by_category():
    data = db.session.query(
        Category.name,
        func.count(Product.id).label("product_count")
    ).outerjoin(Product).group_by(Category.id, Category.name).all()
    result = [
        {
            "category": row[0],
            "product_count": row[1]
        }
        for row in data
    ]

    return jsonify(result), 200