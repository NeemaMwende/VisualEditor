"use client"
import QuestionEditor, { Question } from './components/QuestionEditor';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <QuestionEditor 
        onSave={(data: Question) => {
          console.log(data);  
        }} 
        onBack={() => {
          console.log("this is a placeholder for the back button");
        }} 
      />
    </main>
  );
}
