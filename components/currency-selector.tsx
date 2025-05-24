"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useCurrency, type CurrencyCode } from "@/context/currency-context"

export function CurrencySelector() {
  const { currency, setCurrencyCode, currencies } = useCurrency()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
          <span className="flex items-center">
            {currency.symbol} {currency.code}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {Object.values(currencies).map((curr) => (
                <CommandItem
                  key={curr.code}
                  value={curr.code}
                  onSelect={(value) => {
                    setCurrencyCode(value as CurrencyCode)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", currency.code === curr.code ? "opacity-100" : "opacity-0")} />
                  <span className="mr-2">{curr.symbol}</span>
                  <span>{curr.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
