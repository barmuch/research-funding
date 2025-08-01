import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Research Fund Tracker
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage and monitor your research funding with ease. Track projects, collaborate with your team, and stay organized.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Project Management
            </h3>
            <p className="text-gray-600">
              Organize your research projects in dedicated workspaces with full collaboration features.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fund Tracking
            </h3>
            <p className="text-gray-600">
              Monitor your research funding, expenses, and budget allocation in real-time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Team Collaboration
            </h3>
            <p className="text-gray-600">
              Work seamlessly with your research team through shared workspaces and real-time updates.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Get Started Today
            </h2>
            <p className="text-gray-600 mb-6">
              Join researchers worldwide who trust our platform to manage their funding.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/register"
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md font-medium hover:bg-indigo-700 transition duration-200 block"
              >
                Create Account
              </Link>
              <Link
                href="/auth/login"
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-md font-medium hover:bg-gray-200 transition duration-200 block"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>&copy; 2025 Research Fund Tracker. Built with Next.js, MongoDB, and modern web technologies.</p>
        </div>
      </div>
    </div>
  );
}
