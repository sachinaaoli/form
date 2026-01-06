import MultiStepForm from "@/components/MultiStepForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8"> Application Form Sample</h1>
        <MultiStepForm />
      </div>
    </main>
  );
}