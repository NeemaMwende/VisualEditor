import QuestionEditor from './components/QuestionEditor';
import { QuestionData } from '../components/Interfaces';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <QuestionEditor onSave={function (data: QuestionData): void {
        throw new Error('Function not implemented.');
      } } onBack={function (): void {
        throw new Error('Function not implemented.');
      } } />
    </main>
  );
}
