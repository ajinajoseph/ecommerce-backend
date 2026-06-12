from .extensions import db
from datetime import datetime
from .enums import UserRole


class User(db.Model):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default=UserRole.USER.value)
    otp_code = db.Column(db.String(10), nullable=True)
    otp_expires_at = db.Column(db.DateTime, nullable=True)
    failed_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)
    otp_failed_attempts = db.Column(db.Integer, default=0)
    otp_locked_until = db.Column(db.DateTime, nullable=True)
    reset_otp = db.Column(db.String(10), nullable=True)
    reset_otp_expires_at = db.Column(db.DateTime, nullable=True)
    active_session_token = db.Column(db.String(255), nullable=True)
    carts = db.relationship("Cart", backref="user", lazy=True, cascade="all, delete-orphan")
    orders = db.relationship("Order", backref="user", lazy=True, cascade="all, delete-orphan")
class Category(db.Model):
    __tablename__ = "category"
    __table_args__ = (
        db.UniqueConstraint("name", name="unique_category_name"),
    )
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    products = db.relationship("Product", backref="category", lazy=True)


class Product(db.Model):
    __tablename__ = "product"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)
    category_id = db.Column(db.Integer, db.ForeignKey("category.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    cart_items = db.relationship("CartItem", backref="product", lazy=True)
    images = db.relationship("ProductImage", backref="product", lazy=True, cascade="all, delete-orphan")


class ProductImage(db.Model):
    __tablename__ = "product_image"
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    image_path = db.Column(db.String(255), nullable=False)
    thumbnail_path = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Cart(db.Model):
    __tablename__ = "cart"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship("CartItem", backref="cart", lazy=True, cascade="all, delete-orphan")


class CartItem(db.Model):
    __tablename__ = "cart_item"
    __table_args__ = (
        db.UniqueConstraint("cart_id", "product_id", name="unique_product_per_cart"),
    )
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey("cart.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)


class Order(db.Model):
    __tablename__ = "order"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    total_amount = db.Column(db.Float, nullable=False, default=0)
    status = db.Column(db.String(50), nullable=False, default="placed")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship("OrderItem", backref="order", lazy=True, cascade="all, delete-orphan")


class OrderItem(db.Model):
    __tablename__ = "order_item"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_purchase = db.Column(db.Float, nullable=False)