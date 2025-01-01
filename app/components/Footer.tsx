"use client";


import React, { ReactNode } from 'react';
import { Github, Linkedin, LucideProps, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export const FooterLink = ({ onClick, children }: { onClick: React.MouseEventHandler<HTMLParagraphElement>, children: ReactNode }) => (
    <p
      onClick={onClick}
      className="block text-gray-600 hover:text-black transition-colors cursor-pointer"
    >
      {children}
    </p>
);

export const FooterSection = ({ title, children }: { title: string, children: ReactNode }) => (
    <div className="space-y-4">
      <h3 className="font-mono text-sm text-gray-500">{title}</h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
);

export const SocialLink = ({ href, icon: Icon, label }: { href: string, icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>, label: string }) => (
    <motion.a
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-600 hover:text-black transition-colors"
      aria-label={label}
    >
      <Icon className="w-6 h-6" />
    </motion.a>
);

const Footer = () => {
    const router = useRouter();
    const handlePlatforMenuOnClick = (path: string) => {
        if(localStorage.getItem("rr-userid")){
            router.push(`/${path}`);
        }else {
            router.push("/start-earning");
        }
    }
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <FooterSection title="PLATFORM">
            <FooterLink onClick={()=>handlePlatforMenuOnClick("earn")}>Earn</FooterLink>
            <FooterLink onClick={()=>handlePlatforMenuOnClick("post-tasks")}>Post Task</FooterLink>
            <FooterLink onClick={()=>handlePlatforMenuOnClick("mywallet")}>My Wallet</FooterLink>
          </FooterSection>

          <FooterSection title="DEVELOPER">
            <Link className="block text-gray-600 hover:text-black transition-colors cursor-pointer" href="https://swaparupmukherjee.vercel.app/" target='_blank'>PortFolio</Link>
          </FooterSection>

          <FooterSection title="SUPPORT">
            <FooterLink onClick={()=>handlePlatforMenuOnClick("/")}>Help Center</FooterLink>
            <FooterLink onClick={()=>handlePlatforMenuOnClick("/")}>Terms of Service</FooterLink>
            <FooterLink onClick={()=>handlePlatforMenuOnClick("/")}>Privacy Policy</FooterLink>
          </FooterSection>

          <div className="space-y-4">
            <h3 className="font-mono text-sm text-gray-500">CONNECT</h3>
            <div className="flex space-x-4">
              <SocialLink href="https://github.com/swaparup36" icon={Github} label="GitHub" />
              <SocialLink href="https://x.com/Swaparup36" icon={Twitter} label="Twitter" />
              <SocialLink href="https://www.linkedin.com/in/swaparup-mukherjee-508001280/" icon={Linkedin} label="Discord" />
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} Swaparup Mukherjee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;