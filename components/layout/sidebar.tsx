"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Dashboard</h2>
          <div className="space-y-1">
            <Button
              asChild
              variant={pathname === "/dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Overview
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Accounting</h2>
          <div className="space-y-1">
            <Button asChild variant={pathname === "/accounts" ? "secondary" : "ghost"} className="w-full justify-start">
              <Link href="/accounts">
                <BookOpen className="mr-2 h-4 w-4" />
                Chart of Accounts
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname === "/journal-entries" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/journal-entries">
                <FileText className="mr-2 h-4 w-4" />
                Journal Entries
              </Link>
            </Button>
            <Button asChild variant={pathname === "/ledger" ? "secondary" : "ghost"} className="w-full justify-start">
              <Link href="/ledger">
                <ClipboardList className="mr-2 h-4 w-4" />
                Ledger
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname === "/trial-balance" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/trial-balance">
                <BarChart3 className="mr-2 h-4 w-4" />
                Trial Balance
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname === "/adjustments" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/adjustments">
                <Settings className="mr-2 h-4 w-4" />
                Adjustments
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname.startsWith("/financials") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/financials">
                <CreditCard className="mr-2 h-4 w-4" />
                Financial Statements
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Inventory</h2>
          <div className="space-y-1">
            <Button
              asChild
              variant={pathname === "/inventory" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/inventory">
                <Package className="mr-2 h-4 w-4" />
                Inventory Items
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname === "/transactions" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/transactions">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Transactions
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Administration</h2>
          <div className="space-y-1">
            <Button
              asChild
              variant={pathname === "/close-period" ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Link href="/close-period">
                <Settings className="mr-2 h-4 w-4" />
                Close Period
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
