'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Formation {
  id: string;
  name: string;
  thumbnail: string;
  drone_count: number;
  duration: number;
  rating: number;
  category: string;
  tags: string[];
}

const formations: Formation[] = [
  {
    id: 'beating-heart',
    name: 'Beating Heart',
    thumbnail: '/assets/formations/beating-heart.jpg',
    drone_count: 100,
    duration: 47.92,
    rating: 8,
    category: 'Love',
    tags: ['romantic', 'wedding', 'valentine']
  },
  {
    id: 'starry-night',
    name: 'Starry Night',
    thumbnail: '/assets/formations/starry-night.jpg',
    drone_count: 255,
    duration: 10.38,
    rating: 8,
    category: 'Celestial',
    tags: ['artistic', 'night', 'van gogh']
  },
  {
    id: 'ring-from-box',
    name: 'Ring Coming Out of a Box',
    thumbnail: '/assets/formations/ring-from-box.jpg',
    drone_count: 91,
    duration: 60.0,
    rating: 7,
    category: 'Proposal',
    tags: ['proposal', 'engagement', 'surprise']
  },
  {
    id: 'unfolding-rose',
    name: 'Unfolding Rose',
    thumbnail: '/assets/formations/unfolding-rose.jpg',
    drone_count: 100,
    duration: 20.83,
    rating: 7,
    category: 'Love',
    tags: ['flower', 'romantic', 'nature']
  },
  {
    id: 'spiral',
    name: 'Spiral',
    thumbnail: '/assets/formations/spiral.jpg',
    drone_count: 200,
    duration: 34.0,
    rating: 7,
    category: 'Epic',
    tags: ['geometric', 'mesmerizing', 'pattern']
  },
  {
    id: 'dahlia',
    name: 'Dahlia',
    thumbnail: '/assets/formations/dahlia.jpg',
    drone_count: 50,
    duration: 32.04,
    rating: 6,
    category: 'Love',
    tags: ['flower', 'elegant', 'garden']
  },
  {
    id: 'magic-carpet',
    name: 'Magic Carpet',
    thumbnail: '/assets/formations/magic-carpet.jpg',
    drone_count: 50,
    duration: 30.75,
    rating: 6,
    category: 'Epic',
    tags: ['magical', 'floating', 'fantasy']
  },
  {
    id: 'looping-circles',
    name: 'Looping Circles',
    thumbnail: '/assets/formations/looping-circles.jpg',
    drone_count: 50,
    duration: 30.75,
    rating: 6,
    category: 'Epic',
    tags: ['geometric', 'hypnotic', 'circles']
  },
  {
    id: 'yin-yang',
    name: 'Yin Yang',
    thumbnail: '/assets/formations/yin-yang.jpg',
    drone_count: 100,
    duration: 32.0,
    rating: 6,
    category: 'Celestial',
    tags: ['balance', 'zen', 'philosophy']
  },
  {
    id: 'flapping-dolphin',
    name: 'Flapping Dolphin',
    thumbnail: '/assets/formations/flapping-dolphin.jpg',
    drone_count: 100,
    duration: 41.71,
    rating: 6,
    category: 'Epic',
    tags: ['animal', 'ocean', 'movement']
  },
  {
    id: 'sparkling-eiffel-tower',
    name: 'Sparkling Eiffel Tower',
    thumbnail: '/assets/formations/sparkling-eiffel-tower.jpg',
    drone_count: 192,
    duration: 50.0,
    rating: 6,
    category: 'Epic',
    tags: ['landmark', 'paris', 'architecture']
  },
  {
    id: 'torus-loop',
    name: 'Torus Loop',
    thumbnail: '/assets/formations/torus-loop.jpg',
    drone_count: 200,
    duration: 34.0,
    rating: 6,
    category: 'Epic',
    tags: ['geometric', '3d', 'mathematical']
  }
];

const categories = [
  { id: 'all', name: 'All', icon: '/assets/icons/filter.svg' },
  { id: 'wedding', name: 'Wedding', icon: '/assets/images/categories/wedding.png' },
  { id: 'proposal', name: 'Proposal', icon: '/assets/images/categories/proposal.png' },
  { id: 'epic', name: 'Epic', icon: '/assets/images/categories/epic.png' },
  { id: 'christmas', name: 'Christmas', icon: '/assets/images/categories/christmas.png' },
  { id: 'july4th', name: '4th of July', icon: '/assets/images/categories/july4th.png' },
  { id: 'love', name: 'Love', icon: '/assets/images/categories/love.png' },
  { id: 'celestial', name: 'Celestial', icon: '/assets/images/categories/celestial.png' },
  { id: 'halloween', name: 'Halloween', icon: '/assets/images/categories/halloween.png' },
  { id: 'gift', name: 'Gift', icon: '/assets/images/categories/gift.png' }
];

export default function DiscoverPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredFormations, setFilteredFormations] = useState(formations);

  useEffect(() => {
    let filtered = formations;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(formation =>
        formation.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(formation =>
        formation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formation.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredFormations(filtered);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light mb-4">Discover Formations</h1>
          <p className="text-gray-600 text-lg">
            Browse the world's largest drone show formation library
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Image src="/assets/icons/search.svg" alt="Search" width={20} height={20} />
            </div>
            <input
              type="text"
              placeholder="Search formations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort & Filter */}
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-full hover:bg-gray-50">
              <Image src="/assets/icons/filter.svg" alt="Filter" width={16} height={16} />
              <span>Sort & filter</span>
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Image src={category.icon} alt={category.name} width={20} height={20} />
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredFormations.length} formations found
          </p>
        </div>

        {/* Formation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFormations.map((formation) => (
            <Link
              key={formation.id}
              href={`/formation/${formation.id}`}
              className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={formation.thumbnail}
                  alt={formation.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <button className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70">
                    <Image src="/assets/icons/play.svg" alt="Play" width={16} height={16} />
                  </button>
                </div>
              </div>

              {/* Formation Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                  {formation.name}
                </h3>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Image src="/assets/icons/drone-count.svg" alt="Drones" width={14} height={14} />
                      <span>{formation.drone_count}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Image src="/assets/icons/duration.svg" alt="Duration" width={14} height={14} />
                      <span>{formation.duration}s</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Image src="/assets/icons/star-rating.svg" alt="Rating" width={14} height={14} />
                    <span>{formation.rating}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {formation.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {formation.tags.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{formation.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredFormations.length === 0 && (
          <div className="text-center py-16">
            <Image
              src="/assets/icons/search.svg"
              alt="No results"
              width={64}
              height={64}
              className="mx-auto mb-4 opacity-50"
            />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No formations found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Load More */}
        {filteredFormations.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-gray-100 text-gray-800 px-8 py-3 rounded-full hover:bg-gray-200 transition-colors">
              Load more formations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
