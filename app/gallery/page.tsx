import React from 'react';
import PolicyHub from '@/app/components/PolicyHub';
import Link from 'next/link';

const GalleryPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Policy Hub</h1>
      <PolicyHub />
      <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Back to Editor
      </Link>
    </div>
  );
};

export default GalleryPage;