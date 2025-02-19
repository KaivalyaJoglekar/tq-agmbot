// app/test-image.js
import Image from 'next/image';

export default function TestImage() {
  return (
    <div>
      <h1>Test Image</h1>
      <Image src="/robo.png" alt="Test Avatar" width={100} height={100} />
      <div className="bg-gray-500 h-20 w-20"></div>
    </div>
  );
}