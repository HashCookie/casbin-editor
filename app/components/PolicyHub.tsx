"use client"
import React, { useState, useEffect } from 'react';
import { ShareFormat } from './editor/hooks/useShareInfo';

const PolicyHub: React.FC = () => {
  const [policies, setPolicies] = useState<ShareFormat[]>([]);

  useEffect(() => {
    fetchSharedPolicies().then(setPolicies);
  }, []);

  const fetchSharedPolicies = async (): Promise<ShareFormat[]> => {
    return [
      {
        modelKind: 'basic',
        policy: 'p, alice, data1, read\np, bob, data2, write',
      },
    ];
  };

  return (
    <div className="policy-hub">
      {policies.map((policy, index) => {return (
        <div key={index} className="policy-item mb-4 p-4 border rounded">
          <h3 className="text-xl font-semibold">{policy.modelKind}</h3>
          <p className="mt-2"><strong>Shared by:</strong> User123</p>
          <p><strong>Shared at:</strong> {new Date().toLocaleString()}</p>
          <pre className="mt-2 p-2 bg-gray-100 rounded">{policy.policy}</pre>
        </div>
      )})}
    </div>
  );
};

export default PolicyHub;