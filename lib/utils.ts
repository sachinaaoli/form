import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge"; 
// Merges Tailwind classes safely. Handles conflicts 


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Hits Google's Input Tools API to convert English text into Nepali 
// Wraps in try/catch so the app doesn't crash if the API is offline.
export async function fetchNepaliTransliteration(input: string): Promise<string> {
  try {
    const res = await fetch(
      `https://inputtools.google.com/request?text=${input}&itc=ne-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`
    );
    const data = await res.json();
    
    // Validate response structure before returning the suggestion
    if (data[0] === "SUCCESS" && data[1]?.[0]?.[1]?.[0]) {
      return data[1][0][1][0];
    }
    return input;
  } catch (err) {
    console.error("Transliteration failed", err);
    return input; // Fallback to original text
  }
}

// FileReader so we can use 'await' instead of callbacks.
export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to convert"));
    };
    reader.onerror = () => reject(new Error("Error reading file"));
  });
}

//  1970 to handle leap years accurately
export function calculateAge(dob: Date): number {
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}