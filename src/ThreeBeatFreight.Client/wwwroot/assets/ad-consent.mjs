// This consumes a real installed CMP's TCF callback; it does not certify a CMP or collect consent itself.
export function allowsAdvertising(data,success){
 if(!success||!data||typeof data.gdprApplies!=='boolean'||!Number.isInteger(data.cmpId)||data.cmpId<1)return false;
 if(data.gdprApplies===false)return true;
 if(data.cmpStatus!=='loaded'||!['tcloaded','useractioncomplete'].includes(data.eventStatus)||typeof data.tcString!=='string'||!data.tcString||data.tcString.length>10000||data.vendor?.consents?.[755]!==true)return false;
 for(const purpose of[1,3,4,7,9,10]){if(data.purpose?.consents?.[purpose]!==true)return false;const restriction=data.publisher?.restrictions?.[purpose]?.[755];if(restriction===0)return false;if(restriction===2&&(data.purpose?.legitimateInterests?.[purpose]!==true||data.vendor?.legitimateInterests?.[755]!==true))return false;}
 return true;
}
