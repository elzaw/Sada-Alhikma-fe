import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../../API/instance";
import toast from "react-hot-toast";
import CreateTripForm from "./CreateTripForm";
import UpdateTripForm from "./UpdateTripForm";
import { ConfirmDialog } from "../ConfirmDialog"; // Import the ConfirmDialog component

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterTripNumber, setFilterTripNumber] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const navigate = useNavigate();

  // Fetch trips from API
  const fetchTrips = async () => {
    try {
      const response = await instance.get("/trips");
      setTrips(response.data);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("Failed to fetch trips");
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Navigate to trip page
  const handleTripClick = (tripId) => {
    navigate(`/trip/${tripId}`);
  };

  // Handle update button click
  const handleUpdateClick = (trip, e) => {
    e.stopPropagation();
    setCurrentTrip(trip);
    setShowUpdateForm(true);
  };

  // Handle delete button click
  const handleDeleteClick = (tripId, e) => {
    e.stopPropagation();
    setTripToDelete(tripId);
    setConfirmOpen(true);
  };

  // Confirm delete action
  const handleConfirmDelete = async (tripId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      const response = await instance.delete(`/trips/${tripId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(response.data.message || "تم حذف الرحلة بنجاح");
      fetchTrips(); // Refresh the list
      setConfirmOpen(false); // Close the confirmation dialog
      setTripToDelete(null); // Reset the trip to delete
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(
          error.response.data.error ||
            "غير مصرح لك بحذف الرحلات. يجب أن تكون مسؤولاً للقيام بهذه العملية."
        );
      } else if (error.response?.status === 401) {
        toast.error("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.");
        navigate("/login");
      } else if (error.response?.status === 404) {
        toast.error(error.response.data.error || "الرحلة غير موجودة");
      } else {
        toast.error(error.response?.data?.error || "حدث خطأ أثناء حذف الرحلة");
        console.error("Error deleting trip:", error);
      }
      setConfirmOpen(false);
      setTripToDelete(null);
    }
  };

  // Update the delete button to show only for admins
  const renderDeleteButton = (tripId) => {
    // Check both isAdmin and role to ensure compatibility
    const isAdmin =
      localStorage.getItem("isAdmin") === "true" ||
      localStorage.getItem("role") === "admin";

    if (!isAdmin) {
      console.log("User is not admin. Admin status:", {
        isAdmin: localStorage.getItem("isAdmin"),
        role: localStorage.getItem("role"),
        username: localStorage.getItem("username"),
      });
      return null; // Don't render the button for non-admins
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent trip click event
          handleDeleteClick(tripId, e);
        }}
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
        title="حذف الرحلة"
      >
        <span className="hidden sm:inline">حذف</span>
        <span className="sm:hidden">🗑️</span>
      </button>
    );
  };

  // Filter trips based on date and trip number
  const filteredTrips = trips.filter((trip) => {
    const matchesDate = filterDate
      ? new Date(trip.date).toISOString().split("T")[0] === filterDate
      : true;
    const matchesTripNumber = filterTripNumber
      ? trip.tripNumber.includes(filterTripNumber)
      : true;
    return matchesDate && matchesTripNumber;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">إدارة الرحلات</h1>

      {/* Filters and Create Trip Button */}
      <div className="mb-4 flex flex-col lg:flex-row gap-4">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="ابحث برقم الرحلة"
          value={filterTripNumber}
          onChange={(e) => setFilterTripNumber(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          إنشاء رحلة جديدة
        </button>
      </div>

      {/* Trips List */}
      <div className="space-y-4">
        {filteredTrips.map((trip) => (
          <div
            key={trip._id}
            onClick={() => handleTripClick(trip._id)}
            className="p-4 border rounded-lg shadow-sm bg-white cursor-pointer hover:bg-gray-50 relative"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">
                  الرحلة: {trip.tripNumber} -{" "}
                  {new Date(trip.date).getDate().toString().padStart(2, "0")}/
                  {(new Date(trip.date).getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}
                  /{new Date(trip.date).getFullYear()} -{" "}
                  {new Date(trip.date).toLocaleDateString("ar-SA", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => handleUpdateClick(trip, e)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600"
                >
                  تعديل
                </button>
                {renderDeleteButton(trip._id)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Trip Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-[80vh] overflow-y-auto p-6">
                <CreateTripForm
                  setShowCreateForm={setShowCreateForm}
                  onTripCreated={fetchTrips}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Trip Modal */}
      {showUpdateForm && currentTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-[80vh] overflow-y-auto p-6">
                <UpdateTripForm
                  trip={currentTrip}
                  setShowUpdateForm={setShowUpdateForm}
                  onTripUpdated={fetchTrips}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setTripToDelete(null);
        }}
        onConfirm={() => {
          if (tripToDelete) {
            handleConfirmDelete(tripToDelete);
          }
        }}
        title="تأكيد الحذف"
        message="هل أنت متأكد أنك تريد حذف هذه الرحلة؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default Trips;
