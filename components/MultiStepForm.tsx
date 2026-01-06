"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import NepaliDate from "nepali-date-converter";

import { formSchema, FormSchemaType } from "@/schemas/formSchema";
import { fetchNepaliTransliteration, convertFileToBase64, calculateAge } from "@/lib/utils";
import { NEPALI_DISTRICTS } from "@/lib/districts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf">("image");

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    mode: "onBlur", 
    defaultValues: {
        fullNameEn: "",
        fullNameNp: "",
        gender: "Male", 
        phone: "",
        citizenshipNo: "",
    }
  });

  const { watch, setValue, trigger, formState: { errors } } = form;

  const dobAD = watch("dobAD");
  const gender = watch("gender");

  const isMaleAndOver18 = React.useMemo(() => {
    if (gender === "Male" && dobAD) {
        return calculateAge(dobAD) > 18;
    }
    return false;
  }, [gender, dobAD]);

  const handleDateChange = (type: "AD" | "BS", value: string, fieldPrefix: "dob" | "issuedDate") => {
    try {
      if (type === "AD") {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setValue(`${fieldPrefix}AD`, date, { shouldValidate: true });
          const bsDate = new NepaliDate(date).format("YYYY-MM-DD");
          setValue(`${fieldPrefix}BS`, bsDate, { shouldValidate: true });
        }
      } else {
        const [y, m, d] = value.split("-").map(Number);
        const npDate = new NepaliDate(y, m - 1, d);
        setValue(`${fieldPrefix}BS`, value, { shouldValidate: true });
        setValue(`${fieldPrefix}AD`, npDate.toJsDate(), { shouldValidate: true });
      }
    } catch (e) {
      console.log("Invalid date input");
    }
  };

  const handleUnicodeInput = async (e: React.KeyboardEvent<HTMLInputElement>, field: any) => {
    if (e.key === " ") {
        e.preventDefault();
        const current = field.value || "";
        const words = current.split(" ");
        const lastWord = words[words.length - 1];
        if (lastWord) {
            const converted = await fetchNepaliTransliteration(lastWord);
            const newValue = current.substring(0, current.lastIndexOf(lastWord)) + converted + " ";
            field.onChange(newValue);
        } else {
            field.onChange(current + " ");
        }
    }
  };

  const onContinue = async () => {
    const valid = await trigger(["fullNameEn", "fullNameNp", "gender", "dobAD", "dobBS", "phone"]);
    
    if (isMaleAndOver18 && !watch("phone")) {
        form.setError("phone", { 
            type: "manual", 
            message: "Phone number is required for Males over 18." 
        });
        return; 
    }

    if (valid) {
        setStep(2);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, fieldName: any) => {
    const file = e.target.files?.[0];
    if (file) setValue(fieldName, file, { shouldValidate: true });
  };

  const openPreview = (file: File) => {
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewType(file.type === "application/pdf" ? "pdf" : "image");
  };

  const onSubmit = async (data: FormSchemaType) => {
    try {
        const payload = {
            ...data,
            citizenshipFront: await convertFileToBase64(data.citizenshipFront),
            citizenshipBack: await convertFileToBase64(data.citizenshipBack),
        };
        console.log("FINAL SUBMIT DATA:", payload);
        alert("Form Submitted Successfully!");
    } catch (e) {
        alert("Error submitting form");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="bg-slate-900 text-white rounded-t-xl">
          <CardTitle className="text-xl md:text-2xl text-center"> Form- Step {step} of 2</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField control={form.control} name="fullNameEn" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name (English)</FormLabel>
                        <FormControl><Input placeholder="Sachina Oli" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="fullNameNp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name (Nepali)</FormLabel>
                        <FormControl>
                            <Input placeholder="Type Nepali..." {...field} onKeyDown={(e) => handleUnicodeInput(e, field)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                        <FormLabel>Date of Birth (AD)</FormLabel>
                        <Input type="date" onChange={(e) => handleDateChange("AD", e.target.value, "dob")} />
                        {errors.dobAD && <p className="text-sm text-red-500 font-medium">{errors.dobAD.message}</p>}
                    </FormItem>
                    <FormItem>
                        <FormLabel>Date of Birth (BS)</FormLabel>
                        <Input placeholder="YYYY-MM-DD" value={watch("dobBS") || ""} onChange={(e) => handleDateChange("BS", e.target.value, "dob")} />
                        {errors.dobBS && <p className="text-sm text-red-500 font-medium">{errors.dobBS.message}</p>}
                    </FormItem>
                  </div>
                  
                  {dobAD && (
                      <div className="p-2 bg-blue-50 text-blue-700 rounded text-sm font-medium">
                        Age: {calculateAge(dobAD)} years
                      </div>
                  )}

                  <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel> 
                        <FormControl>
                            <Input placeholder="98XXXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage className="text-red-600" />
                      </FormItem>
                    )}
                  />

                  <Button type="button" onClick={onContinue} className="w-full text-lg">
                    Continue to Documents
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField control={form.control} name="citizenshipNo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Citizenship Number</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField control={form.control} name="issuedDistrict" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issued District</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger></FormControl>
                          <SelectContent className="max-h-60">
                             {NEPALI_DISTRICTS.map((district) => (
                                <SelectItem key={district} value={district}>{district}</SelectItem>
                             ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                        <FormLabel>Issued Date (AD)</FormLabel>
                        <Input type="date" onChange={(e) => handleDateChange("AD", e.target.value, "issuedDate")} />
                        {errors.issuedDateAD && <p className="text-sm text-red-500">{errors.issuedDateAD.message}</p>}
                    </FormItem>
                    <FormItem>
                        <FormLabel>Issued Date (BS)</FormLabel>
                        <Input placeholder="YYYY-MM-DD" value={watch("issuedDateBS") || ""} onChange={(e) => handleDateChange("BS", e.target.value, "issuedDate")} />
                        {errors.issuedDateBS && <p className="text-sm text-red-500">{errors.issuedDateBS.message}</p>}
                    </FormItem>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {["citizenshipFront", "citizenshipBack"].map((key) => (
                        <FormItem key={key}>
                            <FormLabel>{key === "citizenshipFront" ? "Front Photo" : "Back Photo"}</FormLabel>
                            <div className="space-y-2">
                                <Input type="file" accept=".jpg,.png,.pdf" onChange={(e) => handleFile(e, key)} />
                                {watch(key as any) && (
                                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => openPreview(watch(key as any))}>
                                        Preview Upload
                                    </Button>
                                )}
                            </div>
                            {errors[key as keyof FormSchemaType] && (
                                <p className="text-sm text-red-500 font-medium">{(errors[key as keyof FormSchemaType] as any)?.message}</p>
                            )}
                        </FormItem>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                        Submit Application
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

     <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl w-full">
            <DialogTitle>Document Preview</DialogTitle>
            <div className="mt-4 flex justify-center bg-gray-100 p-4 rounded border">
                {previewType === "image" ? (
                    <img src={previewUrl!} alt="Preview" className="max-h-[70vh] w-auto object-contain" />
                ) : (
                    <iframe src={previewUrl!} className="w-full h-[70vh] border-none" title="PDF Preview" />
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}