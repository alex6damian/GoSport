import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-gray-600">
        <p>&copy; {new Date().getFullYear()} GoSport. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
