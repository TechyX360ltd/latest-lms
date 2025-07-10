import React, { useState } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { Header } from '../Layout/Header';
import { useCategories } from '../../hooks/useData';

const courseTypes = [
  { label: 'Text Only', value: 'text' },
  { label: 'Video Only', value: 'video' },
  { label: 'Mixed (Text + Video)', value: 'mixed' },
];

function Stepper({ step }: { step: number }) {
  const steps = ['Course Basics', 'Content', 'Assessments', 'Publish'];
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      {steps.map((label, idx) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all duration-200 ${step === idx + 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300'}`}>{idx + 1}</div>
          <span className={`text-sm font-medium ${step === idx + 1 ? 'text-blue-700' : 'text-gray-400'}`}>{label}</span>
          {idx < steps.length - 1 && <div className="w-8 h-1 bg-blue-200 rounded-full" />}
        </div>
      ))}
    </div>
  );
}

export default function CreateCourse() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const { categories, loading: categoriesLoading } = useCategories();
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [cover, setCover] = useState<File | null>(null);
  const [format, setFormat] = useState('mixed');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!title || !slug || !category || !price || !description || !duration || !format) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-8 overflow-auto flex flex-col items-center">
          <div className="w-full bg-white rounded-xl shadow-lg p-4 md:p-8">
            <Stepper step={step} />
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Course Basics</h2>
                <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Course Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      placeholder="Enter course title"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Course Slug</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={e => setSlug(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      placeholder="e.g. react-for-beginners"
                    />
                  </div>
                </div>
                <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      disabled={categoriesLoading}
                    >
                      <option value="">{categoriesLoading ? 'Loading categories...' : 'Select category'}</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Course Fee (₦)</label>
                    <input
                      type="number"
                      min={0}
                      value={price}
                      onChange={e => setPrice(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>
                <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-start">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold min-h-[100px]"
                      placeholder="Describe your course..."
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Duration (hours)</label>
                    <input
                      type="number"
                      min={0}
                      value={duration}
                      onChange={e => setDuration(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                      placeholder="e.g. 10"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Cover Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setCover(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {cover && <div className="mt-2"><img src={URL.createObjectURL(cover)} alt="cover preview" className="h-32 rounded-lg shadow" /></div>}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Course Type</label>
                  <div className="flex gap-4">
                    {courseTypes.map(opt => (
                      <label key={opt.value} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${format === opt.value ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold' : 'bg-white border-gray-300 text-gray-600'}`}>
                        <input
                          type="radio"
                          name="courseType"
                          value={opt.value}
                          checked={format === opt.value}
                          onChange={() => setFormat(opt.value)}
                          className="form-radio accent-blue-600"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                {error && <div className="text-red-600 mb-4 font-medium">{error}</div>}
                <div className="flex justify-end gap-4">
                  <button
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-lg"
                    onClick={handleNext}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            {step > 1 && (
              <div className="flex justify-between mt-8">
                <button
                  className="px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition text-lg"
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-lg"
                  disabled
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 