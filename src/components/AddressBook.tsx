import React from "react";
import { MapPin, Plus, Phone, Edit2, Truck } from "lucide-react";

interface AddressInfo {
  Id: number;
  CustomerId: number;
  AddressLine1: string;
  AddressLine2: string;
  City: string;
  PostalCode: string;
  IsDefault: boolean;
  AddressType: string;
  MobileNo: string;
  AlternativeMobileNo: string;
  CountryId: number;
  StateId: number;
  Country?: string;
  State?: string;
}

interface AddressBookProps {
  isLoading: boolean;
  profileData: any;
  homeAddress: AddressInfo | null;
  shippingAddresses: AddressInfo[];
  openAddressModal: (type: 'HOME' | 'SHIPPING', addr?: AddressInfo) => void;
  handleSetDefaultShipping: (addressId: number) => Promise<void>;
}

export function AddressBook({
  isLoading,
  profileData,
  homeAddress,
  shippingAddresses,
  openAddressModal,
  handleSetDefaultShipping
}: AddressBookProps) {
  
  const safeRender = (val: any) => {
    if (val === null || val === undefined) return "";
    return String(val);
  };

  return (
    <div className="p-6 sm:p-12 space-y-12">
      <div className="flex items-center justify-between border-b border-neutral-100/80 pb-6">
        <h2 className="text-3xl font-serif text-neutral-900 tracking-tight">Saved Addresses</h2>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <>
          {/* HOME ADDRESS */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-neutral-800 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[var(--color-primary)]" />
                Home Address
              </h3>
              {!homeAddress && (
                <button 
                  type="button"
                  onClick={() => openAddressModal('HOME')} 
                  className="text-sm text-[var(--color-primary)] font-medium hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Home Address
                </button>
              )}
            </div>

            {homeAddress ? (
              <div className="group bg-white rounded-[1.5rem] p-8 border border-neutral-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-[var(--color-primary)]/20 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)] opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <span className="absolute top-6 right-6 text-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1.5 rounded-full uppercase tracking-[0.15em] font-bold">HOME</span>

                <h4 className="font-serif text-2xl text-neutral-900 mb-4 tracking-tight">{profileData?.FirstName} {profileData?.LastName}</h4>

                <div className="space-y-1.5 mb-6">
                  <p className="text-[14px] text-neutral-600 leading-relaxed font-satoshi">
                    {safeRender(homeAddress.AddressLine1)}
                    {homeAddress.AddressLine2 && typeof homeAddress.AddressLine2 !== 'object' ? `, ${homeAddress.AddressLine2}` : ''}
                  </p>
                  <p className="text-[14px] text-neutral-600 font-satoshi">{safeRender(homeAddress.City)}, {safeRender(homeAddress.PostalCode)}</p>
                  <p className="text-[14px] text-neutral-600 font-satoshi">{safeRender(homeAddress.State)}, {safeRender(homeAddress.Country)}</p>
                </div>

                <p className="text-[14px] font-medium text-neutral-700 mb-6 bg-neutral-50/80 px-4 py-2 rounded-xl inline-flex items-center gap-2 border border-neutral-100">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  {safeRender(homeAddress.MobileNo)}
                </p>

                <div className="pt-5 border-t border-neutral-100/80 flex items-center">
                  <button 
                    type="button"
                    onClick={() => openAddressModal('HOME', homeAddress)} 
                    className="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Address
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/50 rounded-3xl p-10 border border-neutral-200 border-dashed text-center hover:bg-white transition-colors">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500 mb-4">You haven't saved a home address yet.</p>
                <button 
                  type="button"
                  onClick={() => openAddressModal('HOME')} 
                  className="px-6 py-2.5 bg-white border border-neutral-200 shadow-sm rounded-full text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all cursor-pointer"
                >
                  Add Home Address
                </button>
              </div>
            )}
          </section>

          {/* SHIPPING ADDRESSES */}
          <section className="space-y-5 pt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-neutral-800 flex items-center gap-3">
                <Truck className="w-5 h-5 text-[var(--color-primary)]" />
                Shipping Addresses
              </h3>
              <button 
                type="button"
                onClick={() => openAddressModal('SHIPPING')} 
                className="text-sm text-[var(--color-primary)] font-medium hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New
              </button>
            </div>

            {shippingAddresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {shippingAddresses.map(addr => (
                  <div key={addr.Id} className={`group bg-white rounded-[1.5rem] p-8 border ${addr.IsDefault ? 'border-[var(--color-primary)]/40 shadow-[0_8px_30px_rgba(91,42,134,0.08)]' : 'border-neutral-100/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-[var(--color-primary)]/20'} relative transition-all duration-500 overflow-hidden`}>
                    {addr.IsDefault && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--color-primary)]"></div>
                    )}

                    <div className="absolute top-6 right-6">
                      <label className="flex items-center gap-2 cursor-pointer group/radio">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${addr.IsDefault ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-neutral-300 group-hover/radio:border-[var(--color-primary)]/50'}`}>
                          {addr.IsDefault && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                        <input
                          type="radio"
                          name="defaultShipping"
                          className="sr-only"
                          checked={addr.IsDefault}
                          onChange={() => !addr.IsDefault && handleSetDefaultShipping(addr.Id)}
                        />
                        <span className={`text-[10px] uppercase tracking-[0.15em] font-bold ${addr.IsDefault ? 'text-[var(--color-primary)]' : 'text-neutral-400 group-hover/radio:text-[var(--color-primary)]/70'}`}>
                          Default
                        </span>
                      </label>
                    </div>

                    <h4 className="font-serif text-2xl text-neutral-900 mb-4 tracking-tight">{profileData?.FirstName} {profileData?.LastName}</h4>

                    <div className="space-y-1.5 mb-6">
                      <p className="text-[14px] text-neutral-600 leading-relaxed font-satoshi">
                        {safeRender(addr.AddressLine1)}
                        {addr.AddressLine2 && typeof addr.AddressLine2 !== 'object' ? `, ${addr.AddressLine2}` : ''}
                      </p>
                      <p className="text-[14px] text-neutral-600 font-satoshi">{safeRender(addr.City)}, {safeRender(addr.PostalCode)}</p>
                      <p className="text-[14px] text-neutral-600 font-satoshi">{safeRender(addr.State)}, {safeRender(addr.Country)}</p>
                    </div>

                    <p className="text-[14px] font-medium text-neutral-700 mb-6 bg-neutral-50/80 px-4 py-2 rounded-xl inline-flex items-center gap-2 border border-neutral-100">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      {safeRender(addr.MobileNo)}
                    </p>

                    <div className="flex items-center gap-6 pt-5 border-t border-neutral-100/80">
                      <button 
                        type="button"
                        onClick={() => openAddressModal('SHIPPING', addr)} 
                        className="text-xs font-semibold text-neutral-500 hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/50 rounded-3xl p-10 border border-neutral-200 border-dashed text-center hover:bg-white transition-colors">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500 mb-4">You haven't saved any shipping addresses yet.</p>
                <button 
                  type="button"
                  onClick={() => openAddressModal('SHIPPING')} 
                  className="px-6 py-2.5 bg-white border border-neutral-200 shadow-sm rounded-full text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all cursor-pointer"
                >
                  Add Shipping Address
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
