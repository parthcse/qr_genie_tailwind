import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { FaFolder, FaEdit, FaTrash, FaTimes, FaCheck, FaChevronLeft } from "react-icons/fa";

export default function FolderHeader({ folder, onFolderUpdated, onFolderDeleted }) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder?.name || "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  // Focus input when renaming starts
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  // Reset rename value when folder changes
  useEffect(() => {
    if (folder?.name) {
      setRenameValue(folder.name);
    }
  }, [folder?.id]);

  const handleRenameStart = () => {
    setIsRenaming(true);
    setError("");
    setRenameValue(folder.name);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setRenameValue(folder.name);
    setError("");
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedName = renameValue.trim();
    
    if (!trimmedName) {
      setError("Folder name cannot be empty");
      return;
    }

    if (trimmedName === folder.name) {
      setIsRenaming(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmedName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to rename folder");
      }

      // Update local state optimistically
      if (onFolderUpdated) {
        onFolderUpdated(data.folder);
      }

      setIsRenaming(false);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to rename folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setError("");
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setError("");
  };

  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete folder");
      }

      // Redirect to dashboard (no folder selected)
      router.push("/dashboard");
      
      // Notify parent component
      if (onFolderDeleted) {
        onFolderDeleted(folder.id);
      }
    } catch (err) {
      setError(err.message || "Failed to delete folder");
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!folder) return null;

  // Handle both array format (from API) and count format
  const qrCount = Array.isArray(folder.qrCodes) 
    ? folder.qrCodes.length 
    : (folder._count?.qrCodes || 0);
  const createdDate = new Date(folder.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Folder Header */}
      <div className="mb-4 sm:mb-6 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Folder Info */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="p-1.5 text-gray-500 hover:text-indigo-600 transition-colors rounded-lg hover:bg-white"
                aria-label="Back to all folders"
                title="Back to all folders"
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md">
                  <FaFolder className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                
                {isRenaming ? (
                  <form onSubmit={handleRenameSubmit} className="flex-1 min-w-0 flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={renameValue}
                      onChange={(e) => {
                        setRenameValue(e.target.value);
                        setError("");
                      }}
                      onBlur={(e) => {
                        // Don't blur if clicking on submit/cancel buttons
                        if (!e.relatedTarget?.closest(".rename-actions")) {
                          handleRenameCancel();
                        }
                      }}
                      className="flex-1 min-w-0 px-3 py-1.5 text-sm sm:text-base font-semibold border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      disabled={isLoading}
                      maxLength={50}
                      aria-label="Folder name"
                      aria-invalid={error ? "true" : "false"}
                      aria-describedby={error ? "rename-error" : undefined}
                    />
                    <div className="rename-actions flex items-center gap-1">
                      <button
                        type="submit"
                        disabled={isLoading || !renameValue.trim()}
                        className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Save folder name"
                        title="Save"
                      >
                        <FaCheck className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRenameCancel}
                        disabled={isLoading}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Cancel rename"
                        title="Cancel"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                      {folder.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-600">
                      <span>{qrCount} {qrCount === 1 ? "QR code" : "QR codes"}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Created {createdDate}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <div
                id="rename-error"
                className="mt-2 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                role="alert"
              >
                {error}
              </div>
            )}
          </div>

          {/* Right: Action Buttons */}
          {!isRenaming && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleRenameStart}
                disabled={isLoading || showDeleteConfirm}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-700 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Rename folder"
              >
                <FaEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Rename</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={isLoading || showDeleteConfirm}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Delete folder"
              >
                <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDeleteCancel();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 p-3 rounded-full bg-red-100">
                <FaTrash className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3
                  id="delete-dialog-title"
                  className="text-lg font-bold text-gray-900 mb-2"
                >
                  Delete Folder
                </h3>
                <p
                  id="delete-dialog-description"
                  className="text-sm text-gray-600"
                >
                  Are you sure you want to delete <strong>"{folder.name}"</strong>? 
                  This will move all {qrCount} {qrCount === 1 ? "QR code" : "QR codes"} in this folder to "No Folder". 
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {error && (
              <div
                className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isLoading ? "Deleting..." : "Delete Folder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
