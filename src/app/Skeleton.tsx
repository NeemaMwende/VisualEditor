import React from 'react';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const QuestionSkeleton = () => (
  <div className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
    <div className="flex items-start gap-4">
      <Skeleton className="w-5 h-5 mt-1" />
      <div className="flex-grow space-y-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-5 w-1/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex justify-end space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  </div>
);

const QuestionEditorSkeleton = () => (
  <div className="w-full max-w-4xl mx-auto p-4">
    <div className="mb-4">
      <Skeleton className="w-24 h-10" />
    </div>
    <div className="bg-white shadow-sm p-6 rounded-lg space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export { Skeleton, QuestionSkeleton, QuestionEditorSkeleton };