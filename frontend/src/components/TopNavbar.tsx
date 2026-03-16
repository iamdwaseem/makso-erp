import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, ChevronDown, Menu } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { WarehouseSelector } from "./WarehouseSelector";

export function TopNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userRef.current?.contains(e.target as Node)) return;
      setUserOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      data-topnav
      className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 text-gray-900 shadow-sm"
    >
      <div className="flex flex-1 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden rounded-lg p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      <WarehouseSelector dark={false} />

      <div className="flex shrink-0 items-center gap-2">
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="User menu"
          >
            <User className="h-4 w-4 text-gray-600" />
            <ChevronDown className="h-4 w-4 text-gray-600" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => {
                  setUserOpen(false);
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
