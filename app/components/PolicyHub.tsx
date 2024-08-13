import React, { useState, useEffect } from 'react';
import { ShareFormat } from './editor/hooks/useShareInfo';

const PolicyHub: React.FC = () => {
  const [policies, setPolicies] = useState<ShareFormat[]>([]);

  useEffect(() => {
    // 从后端获取共享策略
    fetchSharedPolicies().then(setPolicies);
  }, []);

  const fetchSharedPolicies = async (): Promise<ShareFormat[]> => {
    // 这里应该是从后端 API 获取共享策略的逻辑
    // 暂时返回模拟数据
    return [
      {
        modelKind: 'basic',
        sharedBy: 'user1',
        sharedAt: '2023-05-01T12:00:00Z',
        policy: 'p, alice, data1, read\np, bob, data2, write',
      },
      // 更多策略...
    ];
  };

  return (
    <div className="policy-hub">
      <h2>Policy Hub</h2>
      {policies.map((policy, index) => {return (
        <div key={index} className="policy-item">
          <h3>{policy.modelKind}</h3>
          <p>Shared by: {policy.sharedBy}</p>
          <p>Shared at: {new Date(policy.sharedAt!).toLocaleString()}</p>
          <pre>{policy.policy}</pre>
        </div>
      )})}
    </div>
  );
};

export default PolicyHub;