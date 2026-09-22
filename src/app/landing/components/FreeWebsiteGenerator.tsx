'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ChevronRight } from 'lucide-react';

type MenuItem = {
  id: string;
  name: string;
  price: number;
  status: 'Live' | 'Draft';
  img: string;
};

type CartItem = MenuItem & { quantity: number };

type Order = {
  id: string;
  items: CartItem[];
  total: number;
  time: string;
};

const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: "Wagyu Burger", price: 550, status: "Live", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80" },
  { id: '2', name: "Spicy Pasta", price: 380, status: "Live", img: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=500&q=80" },
  { id: '3', name: "Margherita Pizza", price: 450, status: "Live", img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80" },
  { id: '4', name: "Caesar Salad", price: 220, status: "Draft", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80" },
];

export default function FreeWebsiteGenerator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Motion value for the absolute pixel position of the drag handle
  const x = useMotionValue(0);
  
  // SHARED SIMULATION STATE
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dashboardTab, setDashboardTab] = useState<'Menu' | 'Live Orders'>('Menu');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [orderBadgePulse, setOrderBadgePulse] = useState(false);
  
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        setContainerWidth(width);
        // Set initial slider position to the middle (50%)
        x.set(width / 2);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [x]);

  // Transform pixel position into a percentage for the clip-path
  const sliderPosition = useTransform(x, [0, containerWidth || 1000], [0, 100]);
  
  // Construct the CSS clip-path polygon dynamically
  const clipPath = useTransform(
    sliderPosition, 
    (val) => `polygon(0 0, ${val}% 0, ${val}% 100%, 0 100%)`
  );

  // --- EVENT HANDLERS ---
  const toggleStatus = (id: string) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, status: item.status === 'Live' ? 'Draft' : 'Live' } : item));
  };

  const updatePrice = (id: string, newPrice: number) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, price: newPrice } : item));
    setEditingPriceId(null);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const placeOrder = () => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newOrder: Order = {
      id: `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      items: [...cart],
      total,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setIsCartOpen(false);
    
    // Trigger visual feedback on dashboard
    setOrderBadgePulse(true);
    setTimeout(() => setOrderBadgePulse(false), 2000);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="w-full bg-slate-50 pt-32 pb-24 lg:pt-40 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-slate-200">
      <div className="max-w-6xl mx-auto">
        
        {/* Typography & Global Layout */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-slate-900 mb-6 max-w-4xl mx-auto text-balance">
            We Auto-Build Your Website.<br />
            You Keep the <span className="text-[#6DBE45]">$5,000</span> Agency Fee.
          </h2>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Drag the slider. Edit the menu on the left, see it instantly update on the right. Try placing a real-time order!
          </p>
        </div>

        {/* The Interactive Slider */}
        <div 
          ref={containerRef}
          className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-xl border border-slate-200 shadow-2xl overflow-hidden bg-white"
        >
          {/* UNDER LAYER: SaaS Dashboard */}
          <div className="absolute inset-0 bg-white p-4 md:p-8 flex flex-col pointer-events-auto">
            {/* Backend Header */}
            <div className="w-full h-14 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center px-4 md:px-6 mb-6 justify-between shrink-0 z-10 relative">
              <div className="font-bold text-slate-800 tracking-tight">QuickBite Admin</div>
              <div className="flex gap-4 items-center">
                 <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-slate-300 rounded-full"></div>
                 </div>
              </div>
            </div>
            
            <div className="flex gap-4 md:gap-8 flex-1 min-h-0">
              {/* Backend Sidebar */}
              <div className="hidden md:flex flex-col gap-2 w-56 shrink-0 relative z-10">
                <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Dashboard</div>
                <button 
                  onClick={() => setDashboardTab('Menu')} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-colors text-left w-full ${dashboardTab === 'Menu' ? 'bg-slate-50 border-slate-200/60 text-slate-700 font-semibold' : 'border-transparent text-slate-500 font-medium hover:bg-slate-50'}`}
                >
                   <div className={`w-4 h-4 rounded-[3px] ${dashboardTab === 'Menu' ? 'bg-slate-300' : 'bg-slate-200'}`}></div> Menu
                </button>
                <button 
                  onClick={() => setDashboardTab('Live Orders')} 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors text-left w-full ${dashboardTab === 'Live Orders' ? 'bg-slate-50 border-slate-200/60 text-slate-700 font-semibold' : 'border-transparent text-slate-500 font-medium hover:bg-slate-50'}`}
                >
                   <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-[3px] ${dashboardTab === 'Live Orders' ? 'bg-[#6DBE45]' : 'bg-slate-200'}`}></div> Live Orders
                   </div>
                   {orders.length > 0 && (
                     <motion.div 
                        animate={orderBadgePulse ? { scale: [1, 1.2, 1], backgroundColor: ['#6DBE45', '#4ade80', '#6DBE45'] } : {}}
                        className="bg-[#6DBE45] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                     >
                        {orders.length}
                     </motion.div>
                   )}
                </button>
              </div>
              
              {/* Backend Content View */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 pb-4 relative z-10 custom-scrollbar">
                {dashboardTab === 'Menu' ? (
                  <>
                     <div className="flex justify-between items-center mb-2 shrink-0">
                        <div className="text-lg font-bold text-slate-800">Menu Items</div>
                        <div className="px-3 py-1.5 bg-[#6DBE45] text-white text-xs font-bold rounded-lg opacity-80 cursor-not-allowed hidden sm:block">+ Add Item</div>
                     </div>
                     
                     <div className="flex flex-col gap-3">
                       {menuItems.map((item) => (
                         <div key={item.id} className="w-full bg-white h-20 rounded-xl shadow-sm border border-slate-200 flex items-center px-3 md:px-5 gap-3 shrink-0">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                               <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                               <div className="text-sm font-bold text-slate-800 truncate">{item.name}</div>
                               <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                  ₹ 
                                  {editingPriceId === item.id ? (
                                     <input 
                                        type="number" 
                                        defaultValue={item.price} 
                                        autoFocus
                                        onBlur={(e) => updatePrice(item.id, Number(e.target.value) || item.price)}
                                        onKeyDown={(e) => e.key === 'Enter' && updatePrice(item.id, Number(e.currentTarget.value) || item.price)}
                                        className="w-12 px-1 py-0.5 border border-[#6DBE45] rounded outline-none text-slate-800 bg-white shadow-sm"
                                     />
                                  ) : (
                                     <span 
                                        className="cursor-pointer hover:text-[#6DBE45] border-b border-transparent hover:border-[#6DBE45] transition-colors"
                                        onClick={() => setEditingPriceId(item.id)}
                                     >
                                        {item.price}
                                     </span>
                                  )}
                               </div>
                            </div>
                            <div className="flex items-center gap-3 md:gap-5">
                               <div className="hidden lg:flex items-center gap-2 w-16">
                                  <div className={`w-2 h-2 rounded-full ${item.status === 'Live' ? 'bg-[#6DBE45]' : 'bg-slate-300'}`}></div>
                                  <span className="text-xs font-semibold text-slate-600">{item.status}</span>
                               </div>
                               {/* Toggle Switch */}
                               <button 
                                 onClick={() => toggleStatus(item.id)} 
                                 className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-300 ${item.status === 'Live' ? 'bg-[#6DBE45]' : 'bg-slate-200'}`}
                               >
                                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${item.status === 'Live' ? 'translate-x-4' : ''}`}></div>
                               </button>
                            </div>
                         </div>
                       ))}
                     </div>
                  </>
                ) : (
                  <>
                     <div className="flex justify-between items-center mb-2 shrink-0">
                        <div className="text-lg font-bold text-slate-800">Live Orders</div>
                     </div>
                     <div className="flex flex-col gap-3">
                        {orders.length === 0 ? (
                           <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                 <ShoppingCart size={24} className="text-slate-300" />
                              </div>
                              <p className="text-sm font-medium">No orders yet. Place an order on the website!</p>
                           </div>
                        ) : (
                           orders.map((order, i) => (
                              <motion.div 
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 key={i} 
                                 className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 shrink-0"
                              >
                                 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <div className="font-bold text-slate-800">{order.id}</div>
                                    <div className="text-xs font-semibold text-[#6DBE45] bg-[#6DBE45]/10 px-2 py-1 rounded">{order.time}</div>
                                 </div>
                                 <div className="flex flex-col gap-1">
                                    {order.items.map((item, idx) => (
                                       <div key={idx} className="flex justify-between text-sm">
                                          <div className="text-slate-600"><span className="font-bold text-slate-800">{item.quantity}x</span> {item.name}</div>
                                          <div className="text-slate-800 font-semibold">₹{item.price * item.quantity}</div>
                                       </div>
                                    ))}
                                 </div>
                                 <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total</div>
                                    <div className="font-bold text-slate-900 text-lg">₹{order.total}</div>
                                 </div>
                              </motion.div>
                           ))
                        )}
                     </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* TOP LAYER: Premium Website Output */}
          <motion.div 
            className="absolute inset-0 bg-white pointer-events-auto z-20"
            style={{ clipPath }}
          >
             <div className="w-full h-full flex flex-col relative bg-slate-50">
                {/* Website Navbar */}
                <div className="w-full h-16 md:h-20 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 md:px-8 absolute top-0 z-50">
                   <div className="text-lg md:text-xl font-serif font-bold tracking-widest text-slate-900">THE RUSTIC FORK</div>
                   <div className="hidden md:flex gap-8">
                      <div className="text-sm font-semibold text-slate-900 cursor-pointer hover:text-[#6DBE45] transition-colors">Menu</div>
                      <div className="text-sm font-semibold text-slate-600 cursor-pointer hover:text-[#6DBE45] transition-colors">About</div>
                   </div>
                   
                   {/* Cart Button */}
                   <div className="relative">
                      <button 
                         onClick={() => setIsCartOpen(!isCartOpen)}
                         className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-800 transition-colors border border-slate-200"
                      >
                         <ShoppingCart size={16} />
                         <span className="text-sm font-bold">{cartItemCount}</span>
                      </button>
                      
                      {/* Cart Dropdown Overlay */}
                      <AnimatePresence>
                         {isCartOpen && (
                            <motion.div 
                               initial={{ opacity: 0, y: 10, scale: 0.95 }}
                               animate={{ opacity: 1, y: 0, scale: 1 }}
                               exit={{ opacity: 0, y: 10, scale: 0.95 }}
                               className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col origin-top-right z-50"
                            >
                               <div className="p-4 border-b border-slate-100 font-bold text-slate-800 bg-slate-50 flex justify-between items-center">
                                  Your Order
                                  <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                               </div>
                               <div className="p-4 flex flex-col gap-3 max-h-48 overflow-y-auto">
                                  {cart.length === 0 ? (
                                     <div className="text-sm text-slate-500 text-center py-4">Cart is empty</div>
                                  ) : (
                                     cart.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                           <div className="font-semibold text-slate-700">{item.quantity}x {item.name}</div>
                                           <div className="text-slate-900 font-bold">₹{item.price * item.quantity}</div>
                                        </div>
                                     ))
                                  )}
                               </div>
                               {cart.length > 0 && (
                                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                                     <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                                        <span>Total</span>
                                        <span>₹{cartTotal}</span>
                                     </div>
                                     <button onClick={placeOrder} className="w-full py-2 bg-[#6DBE45] hover:bg-[#5ca53a] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                        Place Order <ChevronRight size={16} />
                                     </button>
                                  </div>
                               )}
                            </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                </div>

                {/* Website Hero Section */}
                <div className="h-2/5 md:h-1/2 w-full relative flex items-center justify-center overflow-hidden shrink-0">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center"></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/10"></div>
                   <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 z-10 mt-10">
                      <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-wide text-white mb-3 shadow-sm">Taste the Extraordinary</h1>
                      <p className="text-slate-200 text-xs md:text-sm max-w-md font-medium">Experience culinary excellence in the heart of the city.</p>
                   </div>
                </div>

                {/* Website Menu Grid */}
                <div className="flex-1 bg-white p-4 md:p-8 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 relative z-10 -mt-6 md:-mt-10 mx-2 md:mx-8 rounded-t-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-y-auto pb-8 custom-scrollbar">
                   <AnimatePresence>
                      {menuItems.filter(i => i.status === 'Live').map((item) => (
                         <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={item.id} 
                            className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-shadow relative"
                         >
                            <div className="w-full aspect-[4/3] overflow-hidden relative">
                               <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url('${item.img}')` }}></div>
                            </div>
                            <div className="p-3 md:p-4 flex flex-col items-center text-center pb-12">
                               <div className="font-serif font-bold text-slate-900 mb-0.5 md:mb-1 tracking-wide text-sm md:text-base">{item.name}</div>
                               <div className="text-xs md:text-sm font-bold text-[#6DBE45]">₹{item.price}</div>
                            </div>
                            
                            {/* Interactive Add to Cart Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center z-10">
                               <button 
                                  onClick={() => addToCart(item)}
                                  className="px-4 py-1.5 bg-slate-900 hover:bg-[#6DBE45] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1 shadow-lg"
                               >
                                  + Add <span className="hidden sm:inline">to Order</span>
                               </button>
                            </div>
                         </motion.div>
                      ))}
                   </AnimatePresence>
                   
                   {menuItems.filter(i => i.status === 'Live').length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-500 italic flex flex-col items-center">
                         <div className="w-12 h-12 mb-3 opacity-20"><ShoppingCart size={48} /></div>
                         All items are currently offline. <br/> Toggle them back to "Live" in the Admin dashboard!
                      </div>
                   )}
                </div>
             </div>
          </motion.div>

          {/* THE SCRUBBER HANDLE */}
          <motion.div 
            className="absolute top-0 bottom-0 left-0 w-10 -ml-5 z-40 cursor-ew-resize flex items-center justify-center touch-none"
            style={{ x }}
            drag="x"
            dragConstraints={containerRef}
            dragElastic={0}
            dragMomentum={false}
          >
             {/* The visual vertical line */}
             <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.2)] -translate-x-1/2 pointer-events-none"></div>
             
             {/* The handle button */}
             <div className="w-10 h-10 bg-[#6DBE45] rounded-full shadow-[0_0_20px_rgba(109,190,69,0.4)] flex items-center justify-center border-2 border-white absolute transition-transform hover:scale-110 pointer-events-auto">
                <span className="text-white text-[10px] font-black tracking-tighter opacity-90">&lt;&gt;</span>
             </div>
          </motion.div>
        </div>
        
      </div>
      
      {/* Custom Scrollbar Styles for the nested containers */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}} />
    </section>
  );
}
