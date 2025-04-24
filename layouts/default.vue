<template>
    <div class="min-h-screen bg-gray-50 text-gray-900">
      
      <header class="py-10 text-center bg-white shadow-sm border-b space-y-2">
        <h1 class="text-3xl md:text-4xl font-bold text-blue-800">
          Hamburg ⇄ Amsterdam
        </h1>
        <p class="text-sm md:text-base text-gray-600 max-w-xl mx-auto">
          Find the perfect train connection for business trips or weekend getaways
        </p>
      </header>
  
      <main class="p-6">
        <slot />
      </main>
  
    </div>
  </template>