import React, { useState } from "react";
import { FaTimes, FaBars } from "react-icons/fa";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

const AppLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const sections = [
    { id: 1, title: "الرحلات", path: "/trips" },
    { id: 2, title: "انشاء فاتورة وتسجيل بيانات", path: "/invoice" },
    { id: 3, title: "العودات", path: "/returns" },
    { id: 4, title: "داتا العملاء", path: "/clients" },
    { id: 5, title: "التسكين", path: "/accommodation" },
    { id: 6, title: "انشاء مستخدم", path: "/register" },
    { id: 7, title: "رحلات المدينة", path: "/city-trips" },
    { id: 8, title: "تسجيل خروج", path: "/logout" },
  ];

  return (
    <div className="flex min-h-screen h-auto lg:w-screen">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-full text-center lg:w-2/12 bg-indigo-700 text-white transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative`}
      >
        <div className="flex justify-between items-center p-4 lg:hidden">
          <h1 className="text-xl font-bold">القائمة</h1>
          <button onClick={toggleSidebar}>
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <ul className="mt-10 space-y-4 p-4">
          {sections.map((section) => (
            <li
              key={section.id}
              className="cursor-pointer hover:bg-indigo-800 p-2 rounded"
              onClick={() => {
                navigate(section.path);
                setIsOpen(false);
              }}
            >
              {section.title}
            </li>
          ))}
        </ul>
      </div>
      {/* Content Area */}
      <div className="flex-1 p-6 bg-gray-100 w-full">
        <div className="flex items-center justify-between lg:hidden">
          <button onClick={toggleSidebar}>
            <FaBars className="text-2xl text-indigo-700" />
          </button>
          <h1 className="text-2xl font-bold text-indigo-600">
            الصفحة الرئيسية
          </h1>
        </div>

        <h1 className="hidden lg:block text-3xl font-bold text-indigo-600 mb-8">
          الصفحة الرئيسية
        </h1>

        <div className="mt-6">
          <p className="text-lg text-gray-700">
            اختر أحد الخيارات من القائمة الجانبية.
          </p>
          <Outlet />
        </div>
      </div>

      {/* Overlay for Small Screen */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default AppLayout;
