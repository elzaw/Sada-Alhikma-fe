import React, { useEffect } from "react";
import logo from "../../../assets/logo.png";
const InvoiceContent = ({ clientData, client, booking }) => {
  useEffect(() => {
    window.print(); // طباعة الصفحة تلقائيًا عند تحميلها
    window.onafterprint = () => {
      window.close(); // إغلاق النافذة بعد الطباعة
    };
  }, []);

  return (
    <div className="bg-gray-100 p-2 flex justify-center">
      <div
        dir="rtl"
        className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-8"
      >
        {/* Header */}
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 mx-auto" />
        </div>
        <div className="text-center border-b pb-4 mb-2">
          {/* الشعار */}
          <h2 className="text-2xl font-bold text-gray-800">تذكرة الرحلة</h2>
          <p className="text-sm text-gray-600 mt-2">
            تاريخ الفاتورة:{" "}
            {new Date().toLocaleDateString("ar-SA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Client Details */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            معلومات العميل
          </h3>
          <div className="grid grid-cols-3 gap-4 text-gray-700">
            <p>
              <strong>الاسم:</strong> {clientData.name || "غير متوفر"}
            </p>
            <p>
              <strong>الهاتف:</strong> {clientData.phone || "غير متوفر"}
            </p>
            <p>
              <strong>الهوية:</strong>{" "}
              {clientData.identityNumber || "غير متوفر"}
            </p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            تفاصيل الحجز
          </h3>
          <div className="grid grid-cols-3 gap-4 text-gray-700">
            <p>
              <strong>رقم الرحلة:</strong> {client.tripNumber || "غير متوفر"}
            </p>
            <p>
              <strong>التاريخ:</strong>{" "}
              {client.date
                ? new Date(client.date).toLocaleDateString()
                : "غير متوفر"}
            </p>
            <p>
              <strong>شركة التأجير:</strong>{" "}
              {client.leasingCompany || "غير متوفر"}
            </p>
            <p>
              <strong>نوع الرحلة:</strong> {booking.tripOption || "غير متوفر"}
            </p>
            <p>
              <strong>مكان الركوب:</strong>{" "}
              {booking.pickupLocation || "غير متوفر"}
            </p>
            <p>
              <strong>عدد الايام:</strong> {booking.numberOfDays || "غير متوفر"}
            </p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            تفاصيل الدفع
          </h3>
          <div className="grid grid-cols-4 gap-4 text-gray-700">
            <p>
              <strong>تكلفة الرحلة:</strong> {booking.totalAmount}
            </p>
            <p>
              <strong>المبلغ المدفوع:</strong> {booking.paidAmount}
            </p>
            <p>
              <strong>التحويل البنكي:</strong> {booking.bankTransfer}
            </p>
            <p>
              <strong>الباقي:</strong> {booking.remainingAmount}
            </p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            شروط التذكرة
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li>الالتزام بمواعيد الرحلة المحددة من قبل المكتب.</li>
            <li>لا يحق استرجاع التذكرة قبل 24 ساعة من موعد الرحلة.</li>
            <li>
              من لم يلتزم بمواعيد رحلة المدينة المحددة من قبل المكتب، لا يحق له
              استرجاع المبلغ المدفوع.
            </li>
            <li>
              تخصيص المقاعد: المقاعد الأمامية مخصصة للعوائل، بينما المقاعد
              الخلفية مخصصة للركاب.
            </li>
            <li>عدم التتازل عن التذكرة: التذكرة غير قابلة للتحويل لشخص آخر.</li>
            <li>
              حجز مقاعد للأطفال: يجب على العميل حجز مقاعد منفصلة لأطفاله، ولا
              يُسمح بمرافقتهم دون ذلك.
            </li>
            <li>
              عدم الانتظار عند التأخير: في حال تأخر العميل عن الموعد المحدد، يحق
              للشركة المغادرة دون انتظاره.
            </li>
            <li>
              التزام بالمقعد المحدد: يجب على العميل الجلوس في المقعد المخصص له
              والالتزام بالحافلة المحددة.
            </li>
            <li>
              الحضور المبكر: يتعين على العميل التواجد قبل موعد مغادرة الحافلة
              بساعة على الأقل.
            </li>
            <li>
              الالتزام بالآداب العامة: يُطلب من جميع العملاء الالتزام بالسلوكيات
              والأخلاقيات العامة خلال الرحلة.
            </li>
            <li>
              التقييد بالبرنامج الزمني: يجب على العميل الالتزام بجدول ومواعيد
              الرحلة كما هو محدد.
            </li>
            <li>
              عدم المطالبة بتعويض عند التخلف: في حال عدم التزام العميل بالرحلة،
              لا يحق له المطالبة بأي تعويض.
            </li>
            <li>
              التزام بمقر العودة: إذا اختار العميل السكن خارج البرنامج المحدد،
              فعليه الالتزام بمكان العودة المحدد مسبقًا.
            </li>
            <li>
              المسؤولية عن المتعلقات الشخصية: الشركة غير مسؤولة عن أي مفقودات أو
              متعلقات شخصية للعميل.
            </li>
          </ul>
        </div>

        <hr className="my-2" />

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm">
          <p className="font-bold">
            صـدى الحكمة للعمـــــــــــــرة والزيــــــــــــارة
          </p>
          <p>هاتف: 0530368559 - 0507005838 - 0555435531</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceContent;
