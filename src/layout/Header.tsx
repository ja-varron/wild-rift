"use client"

import { Bell, User } from "lucide-react"

const Header = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <header className="bg-[#F4AC32]">
      <div className="flex justify-between px-5 py-2">
        <div className="flex items-center">
          <img className="size-12" src="/tuon.png" alt="" />
          <h1 className="font-semibold text-white text-xl">Tuon</h1>
        </div>

        {/* Authenticated header */}
        {isAuthenticated ? (
          <div className="flex items-center gap-5">
            <Bell className="text-white cursor-pointer" size={30} />
            <User className="text-white cursor-pointer" size={30} />
          </div>
        ) : (
          // Not authenticated header
          <div className="flex items-center">
            <h3 className="text-white font-medium">Not logged in</h3>
          </div>
        )}
      </div>
    </header>
  )
}

export { Header }
