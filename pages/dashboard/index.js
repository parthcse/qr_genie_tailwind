import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/DashboardLayout";

import QrOverviewModal from "../../components/QrOverviewModal";
import QrDownloadModal from "../../components/QrDownloadModal";
import DesignedQRCode from "../../components/DesignedQRCode";
import FolderHeader from "../../components/FolderHeader";
import { 
  FaQrcode, 
  FaDownload, 
  FaTrash, 
  FaEllipsisH,
  FaSearch,
  FaFolder,
  FaFolderPlus,
  FaCalendar,
  FaEdit,
  FaPause,
  FaPaperPlane,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCheck,
  FaCopy,
  FaFileExport,
  FaGlobe,
  FaWifi,
  FaAddressCard,
  FaMusic,
  FaFilePdf,
  FaLink,
  FaBuilding,
  FaVideo,
  FaImages,
  FaFacebook,
  FaInstagram,
  FaShareAlt,
  FaWhatsapp,
  FaUtensils,
  FaMobileAlt,
  FaTicketAlt,
  FaEye,
  FaExternalLinkAlt,
} from "react-icons/fa";
// This function runs on the server side
export async function getServerSideProps(context) {
  const { getUserFromRequest } = await import('../../lib/auth');
  const user = await getUserFromRequest(context.req);
  if (!user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  // You can fetch user-specific data here if needed
  // const codes = await fetchUserQRCodes(user.id);
  
  return {
    props: {
      // user: JSON.parse(JSON.stringify(user)), // Serialize user data
      // codes: JSON.parse(JSON.stringify(codes || [])),
    },
  };
}

export default function Dashboard() {
  const router = useRouter();

  const { folder: folderIdParam } = router.query;
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCodes, setSelectedCodes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("Most Recent");
  const [quantity, setQuantity] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open
  const [folders, setFolders] = useState([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showSendToModal, setShowSendToModal] = useState(false);
  const [qrCodeToMove, setQrCodeToMove] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(folderIdParam || null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [previewQrCode, setPreviewQrCode] = useState(null);
  const [downloadQrCode, setDownloadQrCode] = useState(null);
  const [editingQrId, setEditingQrId] = useState(null);
  const [editingQrName, setEditingQrName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // QR Type icon mapping
  const getTypeIcon = (type) => {
    const iconMap = {
      website: FaGlobe,
      wifi: FaWifi,
      whatsapp: FaWhatsapp,
      instagram: FaInstagram,
      pdf: FaFilePdf,
      vcard: FaAddressCard,
      links: FaLink,
      business: FaBuilding,
      video: FaVideo,
      images: FaImages,
      facebook: FaFacebook,
      social: FaShareAlt,
      mp3: FaMusic,
      menu: FaUtensils,
      apps: FaMobileAlt,
      coupon: FaTicketAlt,
    };
    return iconMap[type?.toLowerCase()] || FaQrcode;
  };
  
  const loadCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-qr-codes", {
        credentials: 'include' // Important for sending cookies
      });
      
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      
      const data = await res.json();
      setCodes(data.codes || []);
    } catch (error) {
      console.error("Failed to load QR codes:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const loadFolders = async () => {
    try {
      const res = await fetch("/api/folders", {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("Failed to load folders:", error);
    }
  };

  useEffect(() => {
    loadCodes();
    loadFolders();
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setSubscriptionStatus(data.subscriptionStatus || { status: "NONE", daysLeft: null });
        }
      } catch (e) {
        setSubscriptionStatus({ status: "NONE", daysLeft: null });
      }
    };
    fetchMe();
  }, []);

  // Sync selectedFolderId with URL query and update selectedFolder
  useEffect(() => {
    if (folderIdParam) {
      setSelectedFolderId(folderIdParam);
      // Find the selected folder from folders list
      const folder = folders.find((f) => f.id === folderIdParam);
      setSelectedFolder(folder || null);
    } else {
      setSelectedFolderId(null);
      setSelectedFolder(null);
    }
  }, [folderIdParam, folders]);

  // Toggle individual selection
  const toggleSelection = (codeId) => {
    const newSelected = new Set(selectedCodes);
    if (newSelected.has(codeId)) {
      newSelected.delete(codeId);
    } else {
      newSelected.add(codeId);
    }
    setSelectedCodes(newSelected);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedCodes.size === filteredCodes.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(filteredCodes.map(c => c.id)));
    }
  };

  // Filter and sort codes
  const filteredCodes = codes
    .filter(code => {
      const matchesSearch = !searchQuery || 
        (code.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.type?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || (statusFilter === "Active" && code.isActive !== false) || (statusFilter === "Inactive" && code.isActive === false);
      const matchesType = !typeFilter || code.type === typeFilter;
      const matchesFolder = !selectedFolderId || code.folderId === selectedFolderId;
      return matchesSearch && matchesStatus && matchesType && matchesFolder;
    })
    .sort((a, b) => {
      if (sortBy === "Most Recent") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "Oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === "Name A-Z") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "Name Z-A") {
        return (b.name || "").localeCompare(a.name || "");
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredCodes.length / quantity);
  const startIndex = (currentPage - 1) * quantity;
  const endIndex = startIndex + quantity;
  const paginatedCodes = filteredCodes.slice(startIndex, endIndex);

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedCodes.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedCodes.size} QR code(s)? This action cannot be undone.`)) {
      return;
    }

    const ids = Array.from(selectedCodes);
    let deleted = 0;
    let failed = 0;

    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/delete-qr?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
            credentials: "include",
          });
          const data = await res.json().catch(() => ({}));
          return { id, ok: res.ok, data };
        })
      );

      results.forEach((r) => (r.ok ? deleted++ : failed++));
      setSelectedCodes(new Set());
      await loadCodes();

      if (failed > 0) {
        alert(`Deleted ${deleted} QR code(s). ${failed} failed.`);
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      alert("An error occurred while deleting QR codes");
    }
  };

  const handleBulkDownload = () => {
    // Open download modal for the first selected QR code
    const firstSelectedId = Array.from(selectedCodes)[0];
    const code = codes.find(c => c.id === firstSelectedId);
    if (code) {
      setDownloadQrCode(code);
    }
  };

  const handleDownloadClick = (code, e) => {
    e.stopPropagation();
    setDownloadQrCode(code);
  };

  // Individual QR code actions
  const handleDuplicate = async (code) => {
    try {
      const res = await fetch("/api/duplicate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: code.id }),
      });

      const data = await res.json();
      if (res.ok) {
        loadCodes();
        setOpenDropdown(null);
      } else {
        alert(data.error || "Failed to duplicate QR code");
      }
    } catch (error) {
      console.error("Duplicate error:", error);
      alert("An error occurred while duplicating the QR code");
    }
  };

  const handlePause = async (code) => {
    // TODO: Implement pause functionality
    alert("Pause functionality coming soon");
    setOpenDropdown(null);
  };

  const handleSendTo = async (code) => {
    setQrCodeToMove(code);
    setShowSendToModal(true);
    setOpenDropdown(null);
  };

  const handleMoveToFolder = async (folderId) => {
    if (!qrCodeToMove) return;

    try {
      const res = await fetch("/api/move-to-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          qrCodeId: qrCodeToMove.id,
          folderId: folderId || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        loadCodes();
        setShowSendToModal(false);
        setQrCodeToMove(null);
      } else {
        alert(data.error || "Failed to move QR code");
      }
    } catch (error) {
      console.error("Move to folder error:", error);
      alert("An error occurred while moving the QR code");
    }
  };

  // Folder management
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      alert("Please enter a folder name");
      return;
    }

    setCreatingFolder(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewFolderName("");
        setShowCreateFolderModal(false);
        await loadFolders();
      } else {
        alert(data.error || "Failed to create folder");
      }
    } catch (error) {
      console.error("Create folder error:", error);
      alert("An error occurred while creating the folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  // Handle folder updated (after rename)
  const handleFolderUpdated = (updatedFolder) => {
    // Update folders list
    setFolders((prev) =>
      prev.map((f) => (f.id === updatedFolder.id ? updatedFolder : f))
    );
    // Update selected folder if it's the one being renamed
    if (selectedFolder?.id === updatedFolder.id) {
      setSelectedFolder(updatedFolder);
    }
  };

  // Handle folder deleted
  const handleFolderDeleted = (deletedFolderId) => {
    // Remove from folders list
    setFolders((prev) => prev.filter((f) => f.id !== deletedFolderId));
    // Clear selected folder
    setSelectedFolder(null);
    setSelectedFolderId(null);
    // Reload QR codes to update folder assignments
    loadCodes();
  };

  const handleSaveQrName = async (qrId) => {
    if (savingName) return;

    setSavingName(true);
    try {
      const res = await fetch("/api/update-qr-name", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: qrId,
          name: editingQrName.trim(),
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        alert("Failed to parse server response. Please try again.");
        return;
      }

      if (!res.ok) {
        const errorMessage = data.error || data.message || "Failed to update QR code name";
        console.error("API error:", errorMessage, data);
        alert(errorMessage);
        return;
      }

      // Update local state optimistically
      setCodes((prevCodes) =>
        prevCodes.map((code) =>
          code.id === qrId
            ? { ...code, name: data.qrCode.name }
            : code
        )
      );

      setEditingQrId(null);
      setEditingQrName("");
    } catch (error) {
      console.error("Update name error:", error);
      alert("An error occurred while updating QR code name");
    } finally {
      setSavingName(false);
    }
  };

  const handleDelete = async (code) => {
    if (!confirm('Are you sure you want to delete this QR code? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/delete-qr?id=${encodeURIComponent(code.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Failed to delete QR code");
        return;
      }
      await loadCodes();
      setOpenDropdown(null);
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the QR code");
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-menu') && !event.target.closest('.dropdown-trigger')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Get unique QR types for filter
  const qrTypes = [...new Set(codes.map(c => c.type).filter(Boolean))];
  return (
    <DashboardLayout 
      title="" 
      description=""
    >
      {/* Folder Header - Show when folder is selected */}
      {selectedFolder && (
        <FolderHeader
          folder={selectedFolder}
          onFolderUpdated={handleFolderUpdated}
          onFolderDeleted={handleFolderDeleted}
        />
      )}

      {/* My Folders Section */}
      <div className="mb-4 sm:mb-6 w-full max-w-full overflow-hidden">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">My Folders</h2>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full">
          {/* Existing Folders */}
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => {
                setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id);
                setCurrentPage(1);
                router.push(selectedFolderId === folder.id ? '/dashboard' : `/dashboard?folder=${folder.id}`, undefined, { shallow: true });
              }}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border-2 rounded-lg sm:rounded-xl transition-colors ${
                selectedFolderId === folder.id
                  ? "border-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                  : "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:border-indigo-300"
              }`}
            >
              <FaFolder className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">{folder.name}</span>
            </button>
          ))}
          
          {/* New Folder Card */}
          <button
            type="button"
            onClick={() => setShowCreateFolderModal(true)}
            className="inline-flex items-center justify-center p-4 sm:p-6 border-2 border-dashed border-indigo-300 bg-indigo-50 rounded-lg sm:rounded-xl cursor-pointer hover:bg-indigo-100 hover:border-indigo-400 transition-colors"
          >
            <div className="flex flex-col items-center">
              <FaFolderPlus className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm font-medium text-indigo-700">New Folder</span>
            </div>
          </button>
          </div>
      </div>

      {/* My QR Codes Section */}
      <div className="w-full max-w-full overflow-hidden">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">My QR Codes</h2>

        {/* Trial expired banner */}
        {subscriptionStatus?.status === "TRIAL_EXPIRED" && codes.some((c) => c.isActive === false) && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-amber-800">
              Your free trial has ended. Your QR codes have been deactivated.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 whitespace-nowrap"
            >
              Reactivate with a plan
            </Link>
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="mb-4 space-y-3">
          {/* Search Bar */}
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {/* QR Code Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
            </select>
            
            {/* QR Code Types */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
            >
              <option value="">All Types</option>
              {qrTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
            >
              <option value="Most Recent">Most Recent</option>
              <option value="Oldest">Oldest</option>
              <option value="Name A-Z">Name A-Z</option>
              <option value="Name Z-A">Name Z-A</option>
            </select>
            
            {/* Quantity */}
            <select
              value={quantity}
              onChange={(e) => {
                setQuantity(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Select All Checkbox */}
        {filteredCodes.length > 0 && (
          <div className="mb-3 w-full">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCodes.size === filteredCodes.length && filteredCodes.length > 0}
                onChange={toggleSelectAll}
                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Select All</span>
            </label>
          </div>
        )}

        {/* QR Codes List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden w-full max-w-full">
          {loading ? (
            <div className="p-6 text-center text-gray-500">
              Loading your QR codes...
            </div>
          ) : paginatedCodes.length > 0 ? (
            <>
              {/* Unified Card View - Desktop & Mobile */}
              <div className="divide-y divide-gray-200 w-full max-w-full overflow-hidden">
                {paginatedCodes.map((code) => {
                  const isSelected = selectedCodes.has(code.id);
                  const TypeIcon = getTypeIcon(code.type);
                  
                  // Use consistent base URL (environment variable if available, otherwise current origin)
                  const baseUrl = typeof window !== "undefined" 
                    ? (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
                    : (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "");
                  const shortLink = `${baseUrl.replace(/\/$/, "")}/r/${code.slug}`;
                  const destinationUrl = code.type === "wifi" ? "Wi-Fi Network" : (code.targetUrl || shortLink);
                  
                  // For Instagram, WhatsApp, Website, and WiFi: use direct targetUrl
                  // For other types: use short link for analytics tracking
                  const typesWithDirectLink = ["instagram", "whatsapp", "website", "wifi"];
                  const qrValue = typesWithDirectLink.includes(code.type?.toLowerCase())
                    ? code.targetUrl  // Use direct link for these types
                    : shortLink; // Use short link for other types
                  
                  // Get design config (from parsed meta or direct property)
                  // Try multiple sources to ensure we get the design config
                  let designConfig = {};
                  if (code.designConfig) {
                    designConfig = code.designConfig;
                  } else if (code.meta) {
                    if (typeof code.meta === "object" && code.meta.designConfig) {
                      designConfig = code.meta.designConfig;
                    } else if (typeof code.meta === "string") {
                      try {
                        const parsedMeta = JSON.parse(code.meta);
                        if (parsedMeta && parsedMeta.designConfig) {
                          designConfig = parsedMeta.designConfig;
                        }
                      } catch (e) {
                        console.error("Error parsing meta string:", e);
                      }
                    }
                  }
                  
                  // Fallback to basic colors if no design config
                  if (!designConfig.patternColor && code.qrColor) {
                    designConfig.patternColor = code.qrColor;
                    designConfig.qrColor = code.qrColor;
                  }
                  if (!designConfig.bgColor && code.bgColor) {
                    designConfig.bgColor = code.bgColor;
                  }
                  
                  const isStaticQR = code.type === "wifi";
                  const scanCount = code.scanCount || 0;
                  
                  const isInactive = code.isActive === false;
                  return (
                    <div
                      key={code.id}
                      className={`px-4 sm:px-6 py-4 transition-colors border-b border-gray-100 last:border-b-0 ${
                        isInactive ? "bg-gray-100 opacity-90" : "hover:bg-gray-50"
                      } ${isSelected ? "bg-indigo-50 border-l-4 border-l-indigo-600" : ""}`}
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        {/* Checkbox */}
                        <div className="flex-shrink-0 pt-0.5 sm:pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(code.id)}
                            className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                          />
                        </div>

                        {/* QR Thumbnail */}
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewQrCode(code)}
                            className="relative group cursor-pointer"
                            title="Click to preview"
                          >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border border-gray-200 rounded-lg bg-white hover:border-indigo-500 transition-colors overflow-hidden flex items-center justify-center shadow-sm">
                              <DesignedQRCode
                                value={qrValue}
                                designData={designConfig}
                                size={64}
                                showFrame={false}
                                className="w-full h-full"
                              />
                            </div>
                          </button>
                        </div>

                        {/* Primary Info Section */}
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          {/* QR Type */}
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                            <TypeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase">{code.type || "Website"}</span>
                            {isInactive && (
                              <span className="text-[10px] sm:text-xs font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Inactive</span>
                            )}
                          </div>
                          
                          {/* QR Name with Edit */}
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            {editingQrId === code.id ? (
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={editingQrName}
                                  onChange={(e) => setEditingQrName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveQrName(code.id);
                                    } else if (e.key === "Escape") {
                                      setEditingQrId(null);
                                      setEditingQrName("");
                                    }
                                  }}
                                  className="flex-1 min-w-0 px-2 py-1 text-sm sm:text-base font-semibold text-gray-900 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  autoFocus
                                  disabled={savingName}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveQrName(code.id);
                                  }}
                                  disabled={savingName}
                                  className="text-green-600 hover:text-green-700 flex-shrink-0 disabled:opacity-50"
                                  title="Save"
                                >
                                  <FaCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingQrId(null);
                                    setEditingQrName("");
                                  }}
                                  disabled={savingName}
                                  className="text-gray-400 hover:text-gray-600 flex-shrink-0 disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <FaTimes className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                    </div>
                            ) : (
                              <>
                                <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate flex-1 min-w-0">
                                  {code.name || `QR Code #${code.id.slice(0, 8)}`}
                                </h3>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingQrId(code.id);
                                    setEditingQrName(code.name || "");
                                  }}
                                  className="text-gray-400 hover:text-indigo-600 flex-shrink-0 transition-colors"
                                  title="Edit name"
                                >
                                  <FaEdit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                              </>
                            )}
                      </div>
                          
                          {/* Creation Date */}
                          <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3 text-[10px] sm:text-xs text-gray-500">
                            <FaCalendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="truncate">{new Date(code.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>

                          {/* Secondary Info Section */}
                          <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-gray-500">
                            {/* Folder */}
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <FaFolder className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                              <span className="truncate">{code.folder?.name || "No folder"}</span>
                    </div>
                            
                            {/* Destination URL */}
                            {code.type !== "wifi" && (
                              <div className="flex items-start sm:items-center gap-1 sm:gap-1.5 min-w-0">
                                <FaGlobe className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                                <div className="flex-1 min-w-0 flex items-center gap-1">
                                  <a
                                    href={destinationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-700 truncate flex-1 min-w-0"
                                    onClick={(e) => e.stopPropagation()}
                                    title={destinationUrl}
                                  >
                                    <span className="truncate block">{destinationUrl.length > 25 ? `${destinationUrl.substring(0, 25)}...` : destinationUrl}</span>
                      </a>
                      <button
                        type="button"
                                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                    title="Edit destination"
                                  >
                                    <FaEdit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Modified Date */}
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <FaEdit className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 text-gray-400" />
                              <span className="truncate">Modified: {new Date(code.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex-shrink-0 flex flex-row sm:flex-col lg:flex-row items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <button
                            type="button"
                            onClick={(e) => handleDownloadClick(code, e)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-indigo-600 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-50 hover:border-indigo-700 transition-colors whitespace-nowrap"
                          >
                            <FaDownload className="w-3 h-3" />
                            Download
                          </button>
                          {!isStaticQR && (
                            <Link
                              href={`/dashboard/analytics?qr=${code.slug}`}
                              className="inline-flex items-center px-3 py-1.5 bg-white border-2 border-indigo-600 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-50 hover:border-indigo-700 transition-colors whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Detail
                            </Link>
                          )}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(openDropdown === code.id ? null : code.id);
                              }}
                              className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                              title="More options"
                            >
                              <FaEllipsisH className="w-4 h-4" />
                            </button>
                            
                            {openDropdown === code.id && (
                              <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicate(code);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <FaCopy className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                  <span>Duplicate</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendTo(code);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <FaFileExport className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                  <span>Send to</span>
                                </button>
                                <div className="border-t border-gray-200 my-1"></div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePause(code);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                >
                                  <FaPause className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                  <span>Pause</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(code);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                >
                                  <FaTrash className="w-4 h-4 flex-shrink-0" />
                                  <span>Delete</span>
                      </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                  </div>
            </>
          ) : (
            <div className="text-center p-12">
              <FaQrcode className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No QR codes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new QR code.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/create-qr"

                  className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transition-all duration-200"
                >
                  <FaQrcode className="-ml-1 mr-2 h-5 w-5" />
                  New QR Code
                </Link>
              </div>
            </div>
          )}
        </div>


        {/* Pagination */}
        {filteredCodes.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 w-full max-w-full">
            <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredCodes.length)} of {filteredCodes.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                aria-label="Previous page"
              >
                <FaChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs sm:text-sm text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                aria-label="Next page"
              >
                <FaChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedCodes.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 w-full">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedCodes(new Set())}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaTimes className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FaPause className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Pause</span>
              </button>
              <button
                type="button"
                onClick={handleBulkDownload}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FaDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FaPaperPlane className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Send to</span>
              </button>
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap text-center sm:text-left">
              Selected {selectedCodes.size}
            </div>
          </div>
        </div>
      )}
      
      {/* Spacer for bulk actions bar */}
      {selectedCodes.size > 0 && <div className="h-14 sm:h-16"></div>}

      {/* Send to Folder Modal */}
      {showSendToModal && qrCodeToMove && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSendToModal(false);
              setQrCodeToMove(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Send to Folder</h3>
              <button
                type="button"
                onClick={() => {
                  setShowSendToModal(false);
                  setQrCodeToMove(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Select a folder to move "{qrCodeToMove.name || 'QR Code'}" to:
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handleMoveToFolder(null)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaFolder className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">No folder</span>
                </button>
                
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleMoveToFolder(folder.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FaFolder className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Folder Modal */}
      {showCreateFolderModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateFolderModal(false);
              setNewFolderName("");
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Folder</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewFolderName("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateFolder} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  autoFocus
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateFolderModal(false);
                    setNewFolderName("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {creatingFolder ? "Creating..." : "Create Folder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Overview Modal */}
      {previewQrCode && (
        <QrOverviewModal
          qrCode={previewQrCode}
          onClose={() => setPreviewQrCode(null)}
        />
      )}

      {/* QR Download Modal */}
      {downloadQrCode && (
        <QrDownloadModal
          qrCode={downloadQrCode}
          onClose={() => setDownloadQrCode(null)}
        />
      )}
    </DashboardLayout>
  );
}