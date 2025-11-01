// File: components/companion/TranslatedText.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { translateTextAction } from "@/lib/actions/translate.action";
import { Languages } from "lucide-react";

interface TranslatedTextProps {
  text: string;
}

export function TranslatedText({ text }: TranslatedTextProps) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hàm được gọi khi người dùng nhấp vào để dịch
  const handleTranslate = async () => {
    // Chỉ gọi API nếu chưa có bản dịch
    if (translatedText || isLoading) return;

    setIsLoading(true);
    setError(null);
    const result = await translateTextAction(text);
    if (result.success && result.translatedText) {
      setTranslatedText(result.translatedText);
    } else {
      setError(result.error || "Translation failed.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Reset trạng thái khi text thay đổi
    setTranslatedText(null);
    setError(null);
  }, [text]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          className="mb-2 cursor-pointer hover:bg-yellow-100 transition-colors duration-200"
          onClick={handleTranslate}
          title="Click to translate"
        >
          {text}
        </span>
        
      </PopoverTrigger>
      <PopoverContent className="w-80" side="top">
        <div className="space-y-2">
          <h4 className="font-medium leading-none flex items-center gap-2">
            <Languages className="w-4 h-4" />
            Translation (Vietnamese)
          </h4>
          <div className="text-sm text-muted-foreground">
            {isLoading && <p className="animate-pulse">Translating...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {translatedText && (
              <p className="leading-relaxed">{translatedText}</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
