import React from 'react';
import AddPartnerButton from './AddPartnerButton';

export default function PartnerPageHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Total registered DSA partners on the Credit Trust platform. Manage activation, wallet, and access.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <AddPartnerButton />
      </div>
    </div>
  );
}