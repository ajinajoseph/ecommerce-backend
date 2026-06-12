import { useEffect, useState } from "react";

function ImageUpload({
  selectedFiles,
  onFilesChange,
  uploadProgress = 0,
  isUploading = false,
  existingImages = [],
}) {
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    onFilesChange(files);
    event.target.value = "";
  }

  function removeFile(index) {
    onFilesChange(selectedFiles.filter((_, fileIndex) => fileIndex !== index));
  }

  return (
    <div className="image-upload">
      <label className="image-upload-label">
        Product images
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>

      {existingImages.length > 0 && (
        <div className="image-preview-grid">
          {existingImages.map((image) => (
            <div className="image-preview-item" key={image.id}>
              <img src={image.thumbnail_url || image.image_url} alt="Existing product" />
              <span className="image-preview-badge">Saved</span>
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="image-preview-grid">
          {selectedFiles.map((file, index) => (
            <div className="image-preview-item" key={`${file.name}-${index}`}>
              <img src={previewUrls[index]} alt={file.name} />
              <button
                type="button"
                className="image-preview-remove"
                onClick={() => removeFile(index)}
                disabled={isUploading}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <div className="upload-progress">
          <div className="upload-progress-bar">
            <div
              className="upload-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="upload-progress-text">{uploadProgress}%</span>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
