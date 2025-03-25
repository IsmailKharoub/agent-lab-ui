import React from 'react';

type TemplateCategory = 'all' | 'research' | 'scraping' | 'automation' | 'analysis';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  category: string;
  popularity: number;
  instruction: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'github-research',
    title: 'GitHub Repository Research',
    description: 'Find and analyze top repositories on GitHub based on your criteria',
    icon: 'github',
    iconColor: 'text-slate-800',
    category: 'research',
    popularity: 98,
    instruction: 'Search GitHub for the most popular repositories in a specific language or topic. Analyze star count, fork count, and recent activity. Summarize the top 5 repositories.'
  },
  {
    id: 'product-comparison',
    title: 'Product Comparison',
    description: 'Compare products across multiple e-commerce sites',
    icon: 'cart-check',
    iconColor: 'text-green-600',
    category: 'research',
    popularity: 85,
    instruction: 'Search for a specific product on Amazon, Best Buy, and Walmart. Compare prices, features, and customer reviews. Create a detailed comparison table.'
  },
  {
    id: 'news-aggregator',
    title: 'News Aggregator',
    description: 'Collect and summarize news from multiple sources',
    icon: 'newspaper',
    iconColor: 'text-blue-600',
    category: 'research',
    popularity: 92,
    instruction: 'Visit CNN, BBC, and Reuters. Find common news stories across these sites. Summarize each story and note the differences in coverage.'
  },
  {
    id: 'social-profile-analyzer',
    title: 'Social Profile Analyzer',
    description: 'Analyze someone\'s online presence across multiple platforms',
    icon: 'person-badge',
    iconColor: 'text-purple-600',
    category: 'analysis',
    popularity: 78,
    instruction: 'Search for a person\'s profiles on LinkedIn, Twitter, and GitHub. Analyze their professional background, social activity, and technical contributions. Create a comprehensive profile.'
  },
  {
    id: 'ecommerce-price-tracker',
    title: 'E-commerce Price Tracker',
    description: 'Track product prices across multiple sites over time',
    icon: 'graph-up',
    iconColor: 'text-amber-600',
    category: 'scraping',
    popularity: 89,
    instruction: 'Monitor the price of a specific product on Amazon, eBay, and other e-commerce sites. Record daily prices and create a price trend analysis.'
  },
  {
    id: 'competitor-analysis',
    title: 'Competitor Analysis',
    description: 'Research and analyze competitor websites and offerings',
    icon: 'binoculars',
    iconColor: 'text-blue-800',
    category: 'analysis',
    popularity: 82,
    instruction: 'Analyze the websites of three competitor companies. Compare their product offerings, pricing strategies, marketing messages, and user experience. Create a SWOT analysis.'
  },
  {
    id: 'job-finder',
    title: 'Job Finder',
    description: 'Search and compile job listings from multiple job boards',
    icon: 'briefcase',
    iconColor: 'text-emerald-600',
    category: 'automation',
    popularity: 90,
    instruction: 'Search for jobs on LinkedIn, Indeed, and Glassdoor based on specific criteria (title, location, etc.). Compile the listings, including company, role, requirements, and application instructions.'
  },
  {
    id: 'research-paper-finder',
    title: 'Research Paper Finder',
    description: 'Find and summarize academic papers on a specific topic',
    icon: 'journal-text',
    iconColor: 'text-indigo-600',
    category: 'research',
    popularity: 76,
    instruction: 'Search Google Scholar for recent papers on a specific topic. Compile titles, authors, journals, and abstracts. Summarize the key findings from each paper.'
  }
];

const Templates: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState<TemplateCategory>('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  return (
    <div className="p-6 max-w-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Template Gallery</h1>
        <p className="text-slate-500">Choose from pre-built agent templates to get started quickly</p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveCategory('research')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeCategory === 'research' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Research
          </button>
          <button 
            onClick={() => setActiveCategory('scraping')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeCategory === 'scraping' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Data Scraping
          </button>
          <button 
            onClick={() => setActiveCategory('automation')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeCategory === 'automation' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Automation
          </button>
          <button 
            onClick={() => setActiveCategory('analysis')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeCategory === 'analysis' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Analysis
          </button>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="bi bi-search absolute right-3 top-2.5 text-slate-400"></i>
        </div>
      </div>
      
      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center p-4 border-b border-slate-100">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.iconColor} bg-slate-100`}>
                <i className={`bi bi-${template.icon} text-xl`}></i>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-slate-800">{template.title}</h3>
                <div className="flex items-center text-xs text-slate-500">
                  <span className="capitalize">{template.category}</span>
                  <span className="mx-2">•</span>
                  <div className="flex items-center">
                    <i className="bi bi-star-fill text-amber-400 mr-1"></i>
                    <span>{template.popularity}% popularity</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-slate-600 text-sm mb-4">{template.description}</p>
              <div className="flex justify-end">
                <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Use Template
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredTemplates.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <i className="bi bi-search text-2xl text-slate-400"></i>
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-2">No templates found</h3>
          <p className="text-slate-500">Try changing your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default Templates; 