import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import instance from "../../../API/instance";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const InvoiceForm = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const [trips, setTrips] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedTripId = watch("trip")?.value;
  const selectedClientId = watch("client")?.value;
  const totalAmount = watch("totalAmount");
  const paidAmount = watch("paidAmount");
  const bankTransfer = watch("bankTransfer");
  const tripOption = watch("tripOption");
  const madinahDepartureDate = watch("madinahDepartureDate");
  const madinahReturnDate = watch("madinahReturnDate");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token"); // افترض أن التوكن مخزن في localStorage
    if (token) {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id; // افترض أن id المستخدم موجود في التوكن
      setValue("reservationOfficer", userId); // تعيين id المستخدم في حقل مسجل الحجز
    }
  }, [setValue]);
  // مراقبة التغييرات في totalAmount و paidAmount و bankTransfer وحساب remainingAmount
  useEffect(() => {
    const remaining = totalAmount - paidAmount - (bankTransfer || 0);
    setValue("remainingAmount", remaining >= 0 ? remaining : 0);
  }, [totalAmount, paidAmount, bankTransfer, setValue]);

  // جلب الرحلات عند تحميل المكون
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await instance.get("/trips");
        const formattedTrips = response.data.map((trip) => ({
          value: trip._id,
          label: `${trip.tripNumber} - ${new Date(
            trip.date
          ).toLocaleDateString()}`,
        }));
        setTrips(formattedTrips);
      } catch (error) {
        console.error("Error fetching trips:", error);
        toast.error("فشل في تحميل الرحلات.");
      }
    };

    fetchTrips();
  }, []);

  // جلب العملاء عند اختيار رحلة
  useEffect(() => {
    if (selectedTripId) {
      const fetchClients = async () => {
        setLoading(true);
        try {
          const response = await instance.get(`/trips/${selectedTripId}`);
          const formattedClients = (response.data.clients || []).map(
            (client) => ({
              value: client.client._id,
              label: `${client.client.name} - ${client.client.identityNumber}`,
              clientCount: client.clientCount,
              totalCost: client.totalCost,
            })
          );
          setClients(formattedClients);
        } catch (error) {
          console.error("Error fetching clients:", error);
          toast.error("فشل في تحميل العملاء.");
        } finally {
          setLoading(false);
        }
      };

      fetchClients();
    } else {
      setClients([]);
    }
  }, [selectedTripId]);

  useEffect(() => {
    const fetchTrip = async () => {
      if (selectedTripId && selectedClientId) {
        try {
          const response = await instance.get(
            `trips/trip/${selectedTripId}/client/${selectedClientId}`
          );
          const client = response.data.clients[0]; // البيانات المرجعة هي مصفوفة، لذا نأخذ العنصر الأول

          // حساب عدد الأفراد
          const numberOfPeople =
            client.clientCount + client.accompanyingPersons.length;

          // حساب تكلفة الفرد
          const costPerPerson = client.totalCost / numberOfPeople;

          // تحديث الحقول في النموذج
          setValue("numberOfPeople", numberOfPeople);
          setValue("costPerPerson", costPerPerson);
          setValue("totalAmount", client.totalCost);

          // console.log(client); // يمكنك استخدام البيانات هنا
        } catch (error) {
          console.error("Error fetching trip details:", error);
          toast.error("فشل في تحميل بيانات الرحلة والعميل.");
        }
      }
    };

    fetchTrip(); // استدعاء الدالة
  }, [selectedTripId, selectedClientId, setValue]);

  // تحديث بيانات العميل عند اختياره
  useEffect(() => {
    if (selectedClientId) {
      const selectedClient = clients.find(
        (client) => client.value === selectedClientId
      );

      if (selectedClient) {
        setValue("numberOfPeople", selectedClient.clientCount);
        setValue(
          "costPerPerson",
          selectedClient.totalCost / selectedClient.clientCount
        );
        setValue("totalAmount", selectedClient.totalCost);
      }
    }
  }, [selectedClientId, clients, setValue]);

  // إرسال البيانات إلى الخادم
  const submitHandler = async (data) => {
    try {
      const formattedData = {
        ...data,
        trip: data.trip?.value,
        client: data.client?.value,
      };
      console.log(formattedData);

      const response = await instance.post("/invoices", formattedData);
      if (response.status === 201) {
        toast.success("تم إنشاء الفاتورة بنجاح!");
        onSubmit(formattedData);
        navigate(`/client/${selectedClientId}`); // تحويل الى الصفحة الر��يسية للفواتير
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("فشل في إنشاء الفاتورة. " + error.response.data.error);
    }
  };

  useEffect(() => {
    if (
      tripOption === "makkahMadinah" &&
      madinahDepartureDate &&
      madinahReturnDate
    ) {
      const startDate = new Date(madinahDepartureDate);
      const endDate = new Date(madinahReturnDate);
      const timeDiff = endDate - startDate;
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // حساب الفرق بالأيام
      setValue("numberOfDays", daysDiff);
    }
  }, [tripOption, madinahDepartureDate, madinahReturnDate, setValue]);

  // Fetch user ID from backend
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        console.log(token);

        const response = await instance.get("/users/verifyToken", {
          headers: { Authorization: token },
        });

        console.log(response);

        setValue("reservationOfficer", response.data.userId);
      } catch (error) {
        console.error("Error fetching user ID:", error);
        toast.error("Authentication failed. Please log in again.");
        navigate("/login");
      }
    };

    fetchUserId();
  }, [setValue, navigate]);

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="p-6">
      <h2 className="text-xl font-semibold mb-4">إنشاء فاتورة</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* قائمة الرحلات */}
        <div>
          <label className="block mb-1">الرحلة</label>
          <Controller
            name="trip"
            control={control}
            rules={{ required: "هذا الحقل مطلوب" }}
            render={({ field }) => (
              <Select
                {...field}
                options={trips}
                placeholder="اختر رحلة"
                isClearable
              />
            )}
          />
          {errors.trip && (
            <span className="text-red-500 text-sm">{errors.trip.message}</span>
          )}
        </div>

        {/* قائمة العملاء */}
        <div>
          <label className="block mb-1">العميل</label>
          <Controller
            name="client"
            control={control}
            rules={{ required: "هذا الحقل مطلوب" }}
            render={({ field }) => (
              <Select
                {...field}
                options={clients}
                placeholder="اختر عميل"
                isLoading={loading}
                isDisabled={!selectedTripId || loading}
                isClearable
              />
            )}
          />
          {errors.client && (
            <span className="text-red-500 text-sm">
              {errors.client.message}
            </span>
          )}
        </div>

        {/* عدد الأفراد */}
        <div>
          <label className="block mb-1">عدد الأفراد</label>
          <input
            type="number"
            {...register("numberOfPeople", {
              required: "هذا الحقل مطلوب",
              min: 1,
            })}
            className="p-2 border rounded-lg w-full"
          />
          {errors.numberOfPeople && (
            <span className="text-red-500 text-sm">
              {errors.numberOfPeople.message}
            </span>
          )}
        </div>

        {/* تكلفة الفرد */}
        <div>
          <label className="block mb-1">تكلفة الفرد</label>
          <input
            type="number"
            {...register("costPerPerson", {
              required: "هذا الحقل مطلوب",
              min: 0,
            })}
            className="p-2 border rounded-lg w-full"
          />
          {errors.costPerPerson && (
            <span className="text-red-500 text-sm">
              {errors.costPerPerson.message}
            </span>
          )}
        </div>

        {/* التكلفة الإجمالية */}
        <div>
          <label className="block mb-1">التكلفة الإجمالية</label>
          <input
            type="number"
            {...register("totalAmount", {
              required: "هذا الحقل مطلوب",
              min: 0,
            })}
            className="p-2 border rounded-lg w-full"
            readOnly
          />
        </div>

        {/* المدفوع */}
        <div>
          <label className="block mb-1">المدفوع</label>
          <input
            type="number"
            {...register("paidAmount", { required: "هذا الحقل مطلوب", min: 0 })}
            className="p-2 border rounded-lg w-full"
          />
          {errors.paidAmount && (
            <span className="text-red-500 text-sm">
              {errors.paidAmount.message}
            </span>
          )}
        </div>

        {/* التحويل البنكي */}
        <div>
          <label className="block mb-1">التحويل البنكي</label>
          <input
            type="number"
            {...register("bankTransfer", { min: 0 })}
            className="p-2 border rounded-lg w-full"
          />
        </div>

        {/* المتبقي */}
        <div>
          <label className="block mb-1">المتبقي</label>
          <input
            type="number"
            {...register("remainingAmount", {
              required: "هذا الحقل مطلوب",
              min: 0,
            })}
            className="p-2 border rounded-lg w-full"
            readOnly
          />
        </div>

        {/* طريقة الدفع */}
        <div>
          <label className="block mb-1">طريقة الدفع</label>
          <select
            {...register("paymentMethod", { required: "هذا الحقل مطلوب" })}
            className="p-2 border rounded-lg w-full"
          >
            <option value="cash">نقدي</option>
            <option value="bankTransfer">تحويل بنكي</option>
          </select>
          {errors.paymentMethod && (
            <span className="text-red-500 text-sm">
              {errors.paymentMethod.message}
            </span>
          )}
        </div>

        {/* خيارات الرحلة */}
        <div>
          <label className="block mb-1">خيارات الرحلة</label>
          <select
            {...register("tripOption", { required: "هذا الحقل مطلوب" })}
            className="p-2 border rounded-lg w-full"
          >
            <option value="ذهاب فقط">ذهاب فقط</option>
            <option value="ذهاب وعودة">ذهاب وعودة</option>
            <option value="مكة">مكة</option>
            <option value="مكة والمدينة">مكة والمدينة</option>
            <option value="عودة فقط">عودة فقط</option>
            <option value="تسكين فقط">تسكين فقط</option>
          </select>
          {errors.tripOption && (
            <span className="text-red-500 text-sm">
              {errors.tripOption.message}
            </span>
          )}
        </div>

        {/* إظهار حقول إضافية عند اختيار "مكة والمدينة" */}
        {tripOption === "مكة والمدينة" && (
          <>
            <div>
              <label className="block mb-1">تاريخ الذهاب إلى المدينة</label>
              <input
                type="date"
                {...register("madinahDepartureDate", {
                  required: "هذا الحقل مطلوب",
                })}
                className="p-2 border rounded-lg w-full"
              />
              {errors.madinahDepartureDate && (
                <span className="text-red-500 text-sm">
                  {errors.madinahDepartureDate.message}
                </span>
              )}
            </div>

            <div>
              <label className="block mb-1">تاريخ العودة من المدينة</label>
              <input
                type="date"
                {...register("madinahReturnDate", {
                  required: "هذا الحقل مطلوب",
                })}
                className="p-2 border rounded-lg w-full"
              />
              {errors.madinahReturnDate && (
                <span className="text-red-500 text-sm">
                  {errors.madinahReturnDate.message}
                </span>
              )}
            </div>
          </>
        )}

        {/* مكان الركوب */}
        <div>
          <label className="block mb-1">مكان الركوب</label>
          <input
            type="text"
            {...register("pickupLocation", { required: "هذا الحقل مطلوب" })}
            className="p-2 border rounded-lg w-full"
          />
          {errors.pickupLocation && (
            <span className="text-red-500 text-sm">
              {errors.pickupLocation.message}
            </span>
          )}
        </div>

        {/* عدد الأيام */}
        <div>
          <label className="block mb-1">عدد الأيام</label>
          <input
            type="number"
            {...register("numberOfDays", {
              required: "هذا الحقل مطلوب",
              min: 1,
            })}
            className="p-2 border rounded-lg w-full"
            readOnly={tripOption === "makkahMadinah"} // جعل الحقل للقراءة فقط في حالة "مكة والمدينة"
          />
          {errors.numberOfDays && (
            <span className="text-red-500 text-sm">
              {errors.numberOfDays.message}
            </span>
          )}
        </div>

        {/* اسم مسجل الحجز */}
        <div>
          <label className="block mb-1">اسم مسجل الحجز</label>
          <input type="hidden" {...register("reservationOfficer")} />

          {errors.reservationOfficer && (
            <span className="text-red-500 text-sm">
              {errors.reservationOfficer.message}
            </span>
          )}
        </div>

        {/* ملاحظات */}
        <div className="col-span-2">
          <label className="block mb-1">ملاحظات</label>
          <textarea
            {...register("notes")}
            className="p-2 border rounded-lg w-full"
          />
        </div>
      </div>

      {/* بيانات المؤسسة */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">بيانات المؤسسة</h3>
        <p>اسم المؤسسة: صدي الحكمة للعمرة والزيارة</p>
        <p>رقم الهاتف: 0580603848 - 0508364666 - 0542721457</p>
      </div>

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded-lg mt-4"
      >
        إنشاء الفاتورة
      </button>
    </form>
  );
};

export default InvoiceForm;
