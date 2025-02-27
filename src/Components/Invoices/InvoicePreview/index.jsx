import { useEffect, useState } from "react";
import instance from "../../../API/instance";
import { useNavigate } from "react-router-dom"; // لاستخدام navigate للانتقال إلى صفحة الطباعة
import InvoiceContent from "../InvoiceContent";

const InvoicePreview = ({ booking }) => {
  const [client, setClient] = useState(null);
  const [clientData, setClientData] = useState(null);
  const navigate = useNavigate(); // استخدام useNavigate للانتقال إلى صفحة أخرى

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await instance.get(
          `/trips/trip/${booking.trip}/client/${booking.client}/`
        );
        setClient(response.data);
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    };
    fetchClient();
  }, [booking]);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await instance.get(`/clients/${booking.client}/`);
        setClientData(response.data);
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    };
    fetchClient();
  }, [booking]);

  const handlePrint = () => {
    // إرسال البيانات إلى صفحة الطباعة
    navigate("/trip-invoice", {
      state: { clientData, client, booking }, // إرسال البيانات كـ state
    });
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg mt-4">
      <h3 className="text-lg font-bold mb-4">تذكرة الرحلة</h3>
      <div className="space-y-2">
        <p>
          <strong>رقم الرحلة:</strong> {client?.tripNumber || "جارِ التحميل..."}
        </p>
        <p>
          <strong>التاريخ:</strong>{" "}
          {client?.date
            ? `${new Date(client.date)
                .getDate()
                .toString()
                .padStart(2, "0")}-${(new Date(client.date).getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${new Date(
                client.date
              ).getFullYear()}   |   ${new Date(client.date).toLocaleDateString(
                "ar-SA",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}`
            : "جارِ التحميل..."}
        </p>
        <p>
          <strong>شركة التأجير:</strong>{" "}
          {client?.leasingCompany || "جارِ التحميل..."}
        </p>
        <p>
          <strong>تكلفة الرحلة:</strong> {booking.totalAmount} ريال
        </p>
        <p>
          <strong> المبلغ المدفوع نقدا:</strong> {booking.paidAmount} ريال
        </p>
        <p>
          <strong>التحويل البنكي:</strong> {booking.bankTransfer} ريال
        </p>
        <p>
          <strong>الباقي:</strong> {booking.remainingAmount} ريال
        </p>
      </div>
      <button
        onClick={handlePrint}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        طباعة الفاتورة
      </button>
    </div>
  );
};

export default InvoicePreview;
