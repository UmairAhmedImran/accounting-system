import { CurrencyProvider } from "@/context/currency-context"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
    >
      <TooltipProvider>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}