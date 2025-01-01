"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const Navbar = () => {
    const navItems = [ {lable: 'HOME', href: "/"}, {lable:'EARN', href: "/earn"}, {lable:'WALLET', href: '/mywallet'}, {lable:'BLOG', href: "/blogs"}, {lable:'FEATURES', href: "/features"}];
    const [isNavOpen, setIsNavOpen] = useState<boolean>(false);

    return (
      <nav className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <div className="text-black font-mono">
                <Image src="/image/logo.png" width={300} height={280} alt="logo" className="w-60 h-52" />
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="flex space-x-8">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="text-gray-900 hover:text-gray-600 px-3 py-2 text-sm font-medium"
                  >
                    {item.lable}
                  </Link>
                ))}
              </div>
            </div>
  
            <button className="p-2 rounded-full hover:bg-gray-100 md:hidden" onClick={() => setIsNavOpen(!isNavOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {
          isNavOpen &&
          <div className="block md:hidden absolute py-10 bg-white rounded-md w-full">
            <div className="flex flex-col justify-between items-start">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="text-gray-900 hover:text-gray-600 px-3 py-2 ml-5 text-sm font-medium"
                >
                  {item.lable}
                </Link>
              ))}
            </div>
          </div>
        }
      </nav>
    );
};

export default Navbar;