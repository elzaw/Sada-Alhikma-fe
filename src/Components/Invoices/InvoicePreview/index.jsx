import React, { useEffect, useState } from "react";

const InvoicePreview = ({ booking }) => {
  const [client, setClient] = useState(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await instance.get(`/clients/${id}`);
        setClient(response.data);
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    };
  });

  const handlePrint = () => {
    // إنشاء نافذة منبثقة
    console.log(booking);

    const printWindow = window.open("", "_blank");

    // محتوى الفاتورة مع تصميم محسّن
    const invoiceContent = `
      <html>
        <head>
          <title>فاتورة الرحلة</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f9f9f9;
              color: #333;
            }
            .invoice-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #fff;
              border: 1px solid #ddd;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .invoice-header h2 {
              font-size: 24px;
              color: #2c3e50;
              margin: 0;
            }
            .invoice-header p {
              font-size: 14px;
              color: #777;
              margin: 5px 0;
            }
            .invoice-details {
              margin-top: 20px;
            }
            .invoice-details p {
              margin: 8px 0;
              font-size: 16px;
            }
            .invoice-details strong {
              color: #2c3e50;
            }
            .invoice-footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 14px;
              color: #777;
            }
            .invoice-footer img {
              max-width: 100px;
              margin-bottom: 10px;
            }
            .invoice-footer p {
              margin: 5px 0;
            }
            @media print {
              body {
                background-color: #fff;
              }
              .invoice-container {
                box-shadow: none;
                border: none;
              }
            }
          </style>
        </head>
        <body dir="rtl">
          <div class="invoice-container">
            <div class="invoice-header">
              <h2>فاتورة الرحلة</h2>
<p>تاريخ الفاتورة: ${new Date().toLocaleDateString()} - ${new Date().toLocaleDateString(
      "ar-SA",
      {
        weekday: "long", // يوم الأسبوع (مثل "السبت")
        year: "numeric", // السنة (مثل "2023")
        month: "long", // الشهر (مثل "أكتوبر")
        day: "numeric", // اليوم (مثل "15")
      }
    )}</p>            
    </div>
            <div class="invoice-details">
              <p><strong>رقم الرحلة:</strong> ${booking.tripNumber}</p>
              <p><strong>التاريخ:</strong> ${new Date(
                booking.date
              ).toLocaleDateString()}</p>
              <p><strong>شركة التأجير:</strong> ${booking.leasingCompany}</p>
              <p><strong>تكلفة الرحلة:</strong> ${booking.totalAmount} ريال</p>
              <p><strong>المبلغ المدفوع:</strong> ${booking.paidAmount} ريال</p>
              <p><strong>الباقي:</strong> ${booking.remainingAmount} ريال</p>
            </div>
            <div class="invoice-footer">
              <img src="https://via.placeholder.com/100x50?text=شعار+الشركة" alt="شعار الشركة" />
              <p><strong>صـدى الحكمة للعمـــــــــــــرة والزيــــــــــــارة </strong></p>
              <p>الفــروع : ظهــران الجنـــوب - سراة عبيـــدة - احــد رفيـــدة - 
بــارق - باق - المجاردة - القنفذة - نمر</p>
              <p>هاتف: 0530368559 - 0507005838 - 0555435531</p>
              <p>البريد الإلكتروني: info@company.com</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print(); // طباعة النافذة المنبثقة
              window.onafterprint = function() {
                window.close(); // إغلاق النافذة بعد الطباعة
              };
            };
          </script>
        </body>
      </html>
    `;

    // كتابة محتوى الفاتورة في النافذة المنبثقة
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg mt-4">
      <h3 className="text-lg font-bold mb-4">فاتورة الرحلة</h3>
      <div className="space-y-2">
        <p>
          <strong>رقم الرحلة:</strong> {booking.tripNumber}
        </p>
        <p>
          <strong>التاريخ:</strong>{" "}
          {new Date(booking.date).toLocaleDateString()}
        </p>
        <p>
          <strong>شركة التأجير:</strong> {booking.leasingCompany}
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
