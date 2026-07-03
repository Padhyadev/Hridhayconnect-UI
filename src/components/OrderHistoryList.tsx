import React, { useState, useEffect } from "react";
import { ShoppingBag, Calendar, Award, ChevronRight, X, Phone } from "lucide-react";

interface OrderItem {
  Id: number;
  OrderId: number;
  ProductName: string;
  VariantName: string;
  Quantity: number;
  UnitPrice: number;
  TotalPrice: number;
  ImagePath?: string;
}

interface Order {
  Id: number;
  OrderNumber: string;
  OrderDate: string;
  TotalAmount: number;
  DeliveryFee: number;
  DiscountAmount: number;
  UsedCoins: number;
  CoinDiscountAmount: number;
  FinalAmount: number;
  OrderStatusName: string;
  PaymentStatusName: string;
  PaymentModeName: string;
  MobileNo: string;
  AddressLine1: string;
  City: string;
  PostalCode: string;
  TrackingHistory: string;
}

interface OrderHistoryListProps {
  isLoading: boolean;
  orders: Order[];
  orderItems: OrderItem[];
  onCancelOrder: (order: Order) => void;
}

const STANDARD_TIMELINE_STEPS = [
  "Order Placed",
  "Order Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered"
];

const parseTrackingHistory = (historyStr: string) => {
  if (!historyStr || typeof historyStr !== 'string') return [];
  const parts = historyStr.split(',').map(s => s.trim()).filter(Boolean);
  return parts.map(part => {
    const match = part.match(/(.*?)\s*\((.*?)\)/);
    if (match) {
      return { status: match[1].trim(), date: match[2].trim() };
    }
    return { status: part, date: '' };
  });
};

export function OrderHistoryList({
  isLoading,
  orders,
  orderItems,
  onCancelOrder
}: OrderHistoryListProps) {
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");

  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.Id === selectedOrder.Id);
      if (updated) {
        setSelectedOrder(updated);
      }
    }
  }, [orders]);

  const safeRender = (val: any) => {
    if (val === null || val === undefined) return "";
    if (typeof val === 'object') return "";
    return String(val);
  };

  return (
    <div className="p-4 sm:p-8 lg:p-12 space-y-6 sm:space-y-8">
      {selectedOrder ? (
        /* FULL SCREEN ORDER DETAILS VIEW */
        <div className="space-y-6 sm:space-y-8 animate-fade-in pb-10">
          {(() => {
            const order = selectedOrder;
            const items = orderItems.filter(item => item.OrderId === order.Id);
            const trackingSteps = parseTrackingHistory(order.TrackingHistory);

            // Determine active step index
            let activeStepIndex = 0;
            const completedStatuses = trackingSteps.map(t => t.status.toLowerCase());
            let timeline: any[] = [];

            const isCancelled = completedStatuses.some(s => s.includes('cancel'));
            const isReturned = completedStatuses.some(s => s.includes('return') || s.includes('refund'));

            if (isCancelled || isReturned) {
              timeline = trackingSteps.map((step, idx) => {
                activeStepIndex = idx;
                return {
                  name: step.status,
                  isCompleted: true,
                  date: step.date,
                  isActive: false,
                  isErrorState: step.status.toLowerCase().includes('cancel') || step.status.toLowerCase().includes('return')
                };
              });
            } else {
              timeline = STANDARD_TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = completedStatuses.some(s => s.includes(step.toLowerCase()) || step.toLowerCase().includes(s));
                const trackingDetail = trackingSteps.find(t => t.status.toLowerCase().includes(step.toLowerCase()) || step.toLowerCase().includes(t.status.toLowerCase()));
                if (isCompleted) activeStepIndex = idx;
                return {
                  name: step,
                  isCompleted,
                  date: trackingDetail ? trackingDetail.date : null,
                  isActive: false
                };
              });
            }

            // Fix active step highlighting
            timeline.forEach((step, idx) => {
              step.isActive = idx === activeStepIndex;
            });

            return (
              <>
                {/* Back Button & Header Card */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="flex items-center gap-2 text-neutral-500 hover:text-[var(--color-primary)] font-semibold text-sm transition-colors bg-white px-4 py-2 rounded-full border border-neutral-200 shadow-sm hover:shadow-md cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                      Back to Orders
                    </button>

                    {order.OrderStatusName !== 'Cancelled' && order.OrderStatusName !== 'Delivered' && order.OrderStatusName !== 'Returned' && order.OrderStatusName !== 'Refunded' && (
                      <button
                        type="button"
                        onClick={() => onCancelOrder(order)}
                        className="flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-500 font-semibold text-sm transition-colors bg-white px-5 py-2 rounded-full border border-red-200 hover:border-red-500 shadow-sm hover:shadow-md cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        Cancel Order
                      </button>
                    )}
                  </div>

                  <div className="bg-white rounded-[1.5rem] border border-neutral-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col p-8 sm:p-10 relative">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-primary)] opacity-80"></div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                      <div>
                        <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Order Summary Hero</p>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-3xl sm:text-4xl font-serif text-neutral-900 tracking-tight">Order #{safeRender(order.OrderNumber)}</h2>
                        </div>
                        <p className="text-neutral-500 font-medium flex items-center gap-2 font-satoshi">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          Placed on {new Date(safeRender(order.OrderDate)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 lg:gap-10 border-t lg:border-t-0 lg:border-l border-neutral-100/80 pt-6 lg:pt-0 lg:pl-10 relative z-10">
                        <div className="flex flex-col items-start gap-2">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Order Status</span>
                          <span className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] rounded-full border ${['Cancelled', 'Returned', 'Refunded', 'Cancel'].some(s => safeRender(order.OrderStatusName).includes(s))
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-[var(--color-cream)] text-[var(--color-primary)] border-[var(--color-primary)]/10'
                            }`}>
                            {safeRender(order.OrderStatusName)}
                          </span>
                        </div>

                        {order.PaymentStatusName && (
                          <div className="flex flex-col items-start gap-2">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Payment Status</span>
                            <span className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] rounded-full border ${order.PaymentStatusName === 'Paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                              {safeRender(order.PaymentStatusName)}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col items-start gap-1">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Total Amount</span>
                          <span className="text-3xl font-serif tracking-tight text-neutral-900">₹{safeRender(order.FinalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracking Progress Section */}
                <div className="bg-white rounded-[2rem] border border-neutral-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 relative overflow-hidden">
                  <h3 className="text-xl font-semibold text-neutral-800 mb-8 border-b border-neutral-100 pb-4">Tracking History</h3>
                  
                  {/* Timeline Horizontal / Vertical */}
                  <div className="relative flex flex-col md:flex-row justify-between items-start gap-8 md:gap-4 md:pt-6 md:pb-6 font-satoshi overflow-x-auto">
                    {/* Background Bar */}
                    <div className="hidden md:block absolute top-[43px] left-[5%] right-[5%] h-0.5 bg-neutral-100 z-0"></div>
                    
                    {timeline.map((step, idx) => (
                      <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-3 flex-1 min-w-[140px] text-left md:text-center relative z-10 group">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                          step.isActive 
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white scale-110 shadow-md shadow-[var(--color-primary)]/20' 
                            : step.isCompleted 
                            ? 'border-[var(--color-primary)] bg-white text-[var(--color-primary)]' 
                            : step.isErrorState
                            ? 'border-red-500 bg-red-500 text-white'
                            : 'border-neutral-200 bg-white text-neutral-400'
                        }`}>
                          {step.isCompleted ? '✓' : idx + 1}
                        </div>
                        <div>
                          <p className={`text-[13px] font-bold ${step.isActive || step.isCompleted ? 'text-neutral-800' : 'text-neutral-400'} group-hover:text-[var(--color-primary)] transition-colors`}>{step.name}</p>
                          {step.date && (
                            <p className="text-[10px] text-neutral-400 mt-1 font-medium">{step.date}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items and Address Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Items */}
                  <div className="lg:col-span-8 bg-white rounded-[2rem] border border-neutral-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
                    <h3 className="text-xl font-semibold text-neutral-800 mb-6 border-b border-neutral-100 pb-4">Ordered Products</h3>
                    
                    <div className="divide-y divide-neutral-100/80">
                      {items.map(item => (
                        <div key={item.Id} className="py-5 flex gap-4 sm:gap-6 items-center group">
                          <div className="w-20 h-20 rounded-2xl bg-neutral-50 border border-neutral-100 overflow-hidden relative shrink-0">
                            {item.ImagePath ? (
                              <img 
                                src={`https://hridhayconnectreact.bsite.net${item.ImagePath}`} 
                                alt={safeRender(item.ProductName)} 
                                className="w-full h-full object-cover" 
                                onError={(e) => { 
                                  e.currentTarget.style.display = 'none'; 
                                  if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.classList.remove('hidden'); 
                                }} 
                              />
                            ) : null}
                            <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-400 hidden">No image</div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h4 className="font-serif text-lg text-neutral-900 truncate group-hover:text-[var(--color-primary)] transition-colors">{safeRender(item.ProductName)}</h4>
                                {item.VariantName && (
                                  <p className="text-xs text-neutral-400 mt-1 font-satoshi font-medium">{item.VariantName}</p>
                                )}
                                <p className="text-xs text-neutral-500 font-satoshi font-semibold mt-1">Qty: {safeRender(item.Quantity)} • ₹{safeRender(item.UnitPrice)}</p>
                              </div>
                              <p className="font-serif text-lg text-neutral-900 shrink-0">₹{safeRender(item.TotalPrice)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Pricing & Delivery Address */}
                  <div className="lg:col-span-4 space-y-6 sm:space-y-8">
                    
                    {/* Delivery Details */}
                    <div className="bg-white rounded-[2rem] border border-neutral-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
                      <h3 className="text-lg font-semibold text-neutral-800 mb-5 border-b border-neutral-100 pb-3">Delivery Information</h3>
                      <div className="space-y-4 font-satoshi">
                        <div>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1">Contact Phone</p>
                          <p className="text-neutral-700 text-sm font-semibold flex items-center gap-2">
                            <Phone className="w-4 h-4 text-neutral-400" />
                            {safeRender(order.MobileNo)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1">Address Details</p>
                          <p className="text-neutral-700 text-sm font-semibold leading-relaxed">
                            {safeRender(order.AddressLine1)}
                          </p>
                          <p className="text-neutral-500 text-xs font-semibold mt-0.5">
                            {safeRender(order.City)} - {safeRender(order.PostalCode)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-white rounded-[2rem] border border-neutral-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8">
                      <h3 className="text-lg font-semibold text-neutral-800 mb-5 border-b border-neutral-100 pb-3">Bill Details</h3>
                      
                      <div className="space-y-3 font-satoshi text-sm font-medium">
                        <div className="flex justify-between text-neutral-500">
                          <span>Subtotal</span>
                          <span>₹{safeRender(order.TotalAmount)}</span>
                        </div>
                        
                        <div className="flex justify-between text-neutral-500">
                          <span>Delivery Fee</span>
                          <span className="text-green-600 font-bold">{Number(order.DeliveryFee) === 0 ? "FREE" : `+₹${safeRender(order.DeliveryFee)}`}</span>
                        </div>

                        {Number(order.DiscountAmount) > 0 && (
                          <div className="flex justify-between text-green-600 font-semibold">
                            <span>Promo Discount</span>
                            <span>-₹{safeRender(order.DiscountAmount)}</span>
                          </div>
                        )}

                        {Number(order.CoinDiscountAmount) > 0 && (
                          <div className="flex justify-between text-green-600 font-semibold">
                            <span>Coins Used ({safeRender(order.UsedCoins)})</span>
                            <span>-₹{safeRender(order.CoinDiscountAmount)}</span>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t border-neutral-100 flex justify-between items-baseline font-bold text-neutral-900">
                          <span className="text-base">Grand Total</span>
                          <span className="text-2xl font-serif text-[var(--color-primary)]">₹{safeRender(order.FinalAmount)}</span>
                        </div>

                        <div className="pt-4 border-t border-neutral-100/80 flex items-center justify-between text-xs text-neutral-400 font-semibold">
                          <span>Payment Method</span>
                          <span className="text-neutral-700 font-bold uppercase">{safeRender(order.PaymentModeName)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        /* ORDERS LIST VIEW */
        <div className="space-y-6 sm:space-y-8 pb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100/80 pb-6">
            <h2 className="text-3xl font-serif text-neutral-900 tracking-tight">Order History</h2>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by Order #..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all shadow-sm hover:border-neutral-300"
              />
              <svg className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
          </div>

          {/* Filter Chips Premium */}
          <div className="flex gap-3 overflow-x-auto pb-4 pt-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(filter => {
              const filterLabel = filter === 'All' ? 'All Orders' : filter;
              const filterValue = filter === 'All' ? 'All' : filter;
              return (
                <button
                  type="button"
                  key={filterValue}
                  onClick={() => setOrderStatusFilter(filterValue)}
                  className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${orderStatusFilter === filterValue
                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 shadow-sm'
                    }`}
                >
                  {filterLabel}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="mt-8">
              {(() => {
                const filteredOrders = orders.filter(o => {
                  const matchesSearch = o.OrderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase());
                  const matchesFilter = orderStatusFilter === 'All' || o.OrderStatusName.toLowerCase().includes(orderStatusFilter.toLowerCase());
                  return matchesSearch && matchesFilter;
                });

                if (filteredOrders.length === 0) {
                  return (
                    <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-12 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-5 border border-neutral-100">
                        <ShoppingBag className="w-10 h-10 text-neutral-300" />
                      </div>
                      <p className="text-neutral-900 font-serif text-xl mb-2">No orders found</p>
                      <p className="text-neutral-500 font-medium">We couldn't find any orders matching your current filters.</p>
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-[1.5rem] border border-neutral-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b border-neutral-100 bg-neutral-50/50">
                            <th className="px-6 py-5 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Order #</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Date Purchased</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Total</th>
                            <th className="px-6 py-5 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100/80">
                          {filteredOrders.map(order => (
                            <tr 
                              key={order.Id} 
                              className="group hover:bg-neutral-50/50 transition-colors cursor-pointer" 
                              onClick={() => setSelectedOrder(order)}
                            >
                              <td className="px-6 py-5 align-middle">
                                <div>
                                  <p className="font-serif text-lg text-neutral-900 group-hover:text-[var(--color-primary)] transition-colors tracking-tight">#{safeRender(order.OrderNumber)}</p>
                                  <p className="text-xs font-medium text-neutral-500 mt-1 flex items-center gap-1">
                                    <Award className="w-3 h-3" />
                                    {safeRender(order.PaymentModeName)}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-5 align-middle">
                                <p className="text-[14px] font-medium text-neutral-600 font-satoshi flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-neutral-400" />
                                  {new Date(safeRender(order.OrderDate)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                              </td>
                              <td className="px-6 py-5 align-middle space-y-2">
                                <div>
                                  <span className={`inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] rounded-full shadow-sm border ${['Cancelled', 'Returned', 'Refunded', 'Cancel'].some(s => safeRender(order.OrderStatusName).includes(s))
                                    ? 'bg-red-50 text-red-600 border-red-100'
                                    : 'bg-[var(--color-cream)] text-[var(--color-primary)] border-[var(--color-primary)]/10'
                                    }`}>
                                    {safeRender(order.OrderStatusName)}
                                  </span>
                                </div>
                                {order.PaymentStatusName && (
                                  <div>
                                    <span className={`inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] rounded-full border ${order.PaymentStatusName === 'Paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                      {safeRender(order.PaymentStatusName)}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-5 align-middle">
                                <p className="font-serif text-xl text-neutral-900 tracking-tight">₹{safeRender(order.FinalAmount)}</p>
                              </td>
                              <td className="px-6 py-5 align-middle text-right">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                  className="inline-flex px-5 py-2.5 bg-white border border-neutral-200/80 text-neutral-700 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:border-[var(--color-primary)]/30 rounded-full text-[13px] font-bold transition-all shadow-sm items-center justify-center gap-2 group/btn cursor-pointer"
                                >
                                  View
                                  <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
