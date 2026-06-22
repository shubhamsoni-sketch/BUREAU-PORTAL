'use client';
import React from 'react';
import type { Lead } from './LeadManagementContent';
import StatusBadge from '@/crm/components/ui/StatusBadge';

type LeadStage = Lead['stage'];

const KANBAN_STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'border-t-info' },
  { key: 'contacted', label: 'Contacted', color: 'border-t-primary' },
  { key: 'interested', label: 'Interested', color: 'border-t-warning' },
  { key: 'docs_submitted', label: 'Docs Submitted', color: 'border-t-purple-500' },
  { key: 'login_pending', label: 'Login Pending', color: 'border-t-orange-500' },
  { key: 'logged_in', label: 'Logged In', color: 'border-t-blue-500' },
  { key: 'approved', label: 'Approved', color: 'border-t-success' },
  { key: 'disbursed', label: 'Disbursed', color: 'border-t-success' },
];

const formatINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

interface LeadKanbanProps {
  leads: Lead[];
  onStageChange: (leadId: string, stage: LeadStage) => void;
}

export default function LeadKanban({ leads }: LeadKanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-4">
      {KANBAN_STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.stage === stage.key);
        return (
          <div key={`kanban-col-${stage.key}`} className="shrink-0 w-64">
            <div
              className={[
                'bg-card rounded-lg border border-border border-t-2 shadow-card',
                stage.color,
              ].join(' ')}
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <span className="text-xs font-700 text-foreground">{stage.label}</span>
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-muted text-muted-foreground text-[10px] font-700">
                  {stageLeads.length}
                </span>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {stageLeads.length === 0 ? (
                  <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
                    No leads
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={`kanban-card-${lead.id}`}
                      className="bg-background rounded-sm border border-border p-2.5 hover:shadow-card-hover transition-shadow cursor-pointer"
                    >
                      <p className="text-xs font-700 text-foreground mb-1">{lead.name}</p>
                      <p className="text-[10px] text-muted-foreground mb-2">
                        {lead.city} · {lead.mobile}
                      </p>
                      <div className="flex items-center justify-between">
                        <StatusBadge variant={lead.product} size="sm" />
                        <span className="text-[11px] font-700 text-foreground inr-value">
                          {formatINR(lead.loanAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                        <span className="text-[10px] text-muted-foreground">
                          {lead.assignedAgent.split(' ')[0]}
                        </span>
                        <span
                          className={[
                            'text-[10px] font-600',
                            lead.daysInStage >= 5
                              ? 'text-danger'
                              : lead.daysInStage >= 3
                                ? 'text-warning'
                                : 'text-muted-foreground',
                          ].join(' ')}
                        >
                          {lead.daysInStage}d in stage
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
