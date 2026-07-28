import React, { useState, useEffect } from "react";
import PillNav from "@/components/ui/PillNav";

export const Navbar: React.FC = () => {
  const [activeSection, setActiveSection] = useState("#playground");

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setActiveSection(id);
    const element = document.getElementById(id.replace("#", ""));
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["playground", "auth", "grpc", "retries", "telemetry"];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(`#${section}`);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Playground", href: "#playground", onClick: (e: React.MouseEvent) => scrollToSection(e, "#playground") },
    { label: "Auth", href: "#auth", onClick: (e: React.MouseEvent) => scrollToSection(e, "#auth") },
    { label: "gRPC", href: "#grpc", onClick: (e: React.MouseEvent) => scrollToSection(e, "#grpc") },
    { label: "Retries", href: "#retries", onClick: (e: React.MouseEvent) => scrollToSection(e, "#retries") },
    { label: "Telemetry", href: "#telemetry", onClick: (e: React.MouseEvent) => scrollToSection(e, "#telemetry") },
    { label: "GitHub", href: "https://github.com/Zura16/Reusable-Go-Services" },
  ];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <PillNav
        items={navItems}
        activeHref={activeSection}
        ease="power3.easeOut"
        baseColor="#000000"
        pillColor="#ffffff"
        hoveredPillTextColor="#ffffff"
        pillTextColor="#000000"
        initialLoadAnimation={true}
      />
    </div>
  );
};
