import { useEffect, useState } from "react";
import instance from "../../../API/instance";

const InvoicePreview = ({ booking }) => {
  const [client, setClient] = useState(null);

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
  }, [booking]); // Depend on booking to avoid unnecessary re-fetches

  const handlePrint = () => {
    if (!client) {
      alert("لم يتم تحميل بيانات العميل بعد!"); // Alert if client data isn't available yet
      return;
    }

    const printWindow = window.open("", "_blank");

    const invoiceContent = `
      <html>
        <head>
          <title>تذكرة الرحلة</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333; }
            .invoice-container { max-width: 600px; margin: auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
            .invoice-header { text-align: center; margin-bottom: 20px; }
            .invoice-header h2 { font-size: 24px; color: #2c3e50; margin: 0; }
            .invoice-header p { font-size: 14px; color: #777; margin: 5px 0; }
            .invoice-details { margin-top: 20px; }
            .invoice-details p { margin: 8px 0; font-size: 16px; }
            .invoice-footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 14px; color: #777; }
            @media print { body { background-color: #fff; } .invoice-container { box-shadow: none; border: none; } }
          </style>
        </head>
        <body dir="rtl">
          <div class="invoice-container">
            <div class="invoice-header">
              <h2>تذكرة الرحلة</h2>
              <p>تاريخ الفاتورة: ${new Date().toLocaleDateString("ar-SA", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</p>            
            </div>
            <div class="invoice-details">
              <p><strong>رقم الرحلة:</strong> ${
                client.tripNumber || "غير متوفر"
              }</p>
              <p><strong>التاريخ:</strong> ${
                client.date
                  ? new Date(client.date).toLocaleDateString()
                  : "غير متوفر"
              }</p>
              <p><strong>شركة التأجير:</strong> ${
                client.leasingCompany || "غير متوفر"
              }</p>
              <p><strong>تكلفة الرحلة:</strong> ${booking.totalAmount} ريال</p>
              <p><strong>المبلغ المدفوع:</strong> ${booking.paidAmount} ريال</p>
              <p><strong>الباقي:</strong> ${booking.remainingAmount} ريال</p>
            </div>
            <div class="invoice-footer">
              <p><strong>صـدى الحكمة للعمـــــــــــــرة والزيــــــــــــارة </strong></p>
              <p>هاتف: 0530368559 - 0507005838 - 0555435531</p>
              <p>البريد الإلكتروني: info@company.com</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
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
          <strong>المبلغ المدفوع:</strong> {booking.paidAmount} ريال
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
