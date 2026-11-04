import { useState } from "react";
import {
  Archive,
  Mail,
  MailOpen,
  MessageSquare,
  RefreshCw,
  Reply,
  Trash2,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";
import { CONTACT_STATUS_LABELS, CONTACT_STATUS_TONES } from "@/features/contacts/status";
import { contactStatuses } from "@/features/contacts/types";
import type { Contact, ContactStatus } from "@/features/contacts/types";
import {
  useContacts,
  useDeleteContact,
  useUpdateContactStatus,
} from "@/features/contacts/hooks";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 20;

export function ContactsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ContactStatus | "">("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const contactsQuery = useContacts({ page, limit: PAGE_SIZE, status });
  const updateStatus = useUpdateContactStatus();
  const deleteContact = useDeleteContact();

  const contacts = contactsQuery.data?.items ?? [];
  const pagination = contactsQuery.data?.pagination;

  const changeStatus = (contact: Contact, next: ContactStatus) => {
    updateStatus.mutate(
      { id: contact.id, status: next },
      { onSuccess: (updated) => setSelected(updated) },
    );
  };

  const confirmDelete = () => {
    if (!selected) {
      return;
    }

    deleteContact.mutate(selected.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setSelected(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Messages sent through the public contact form. Mark them as read, replied, or archive them when done."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void contactsQuery.refetch()}
            loading={contactsQuery.isFetching && !contactsQuery.isPending}
            leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
          >
            Refresh
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Status"
            value={status}
            className="w-56"
            onChange={(event) => {
              setStatus(event.target.value as ContactStatus | "");
              setPage(1);
            }}
          >
            <option value="">All messages</option>
            {contactStatuses.map((value) => (
              <option key={value} value={value}>
                {CONTACT_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
          {status ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-10"
              onClick={() => {
                setStatus("");
                setPage(1);
              }}
            >
              Clear filter
            </Button>
          ) : null}
        </div>
      </Card>

      {contactsQuery.isPending ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-16">
            <Spinner />
            <p className="text-sm text-stone-500">Loading messages…</p>
          </div>
        </Card>
      ) : contactsQuery.isError ? (
        <Card className="p-6">
          <Alert tone="error" title="Could not load contacts">
            {getErrorMessage(contactsQuery.error)}
          </Alert>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => void contactsQuery.refetch()}>
              Try again
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {contacts.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="size-5" aria-hidden="true" />}
              title="No messages here"
              description="Messages from the public contact form will show up in this inbox."
            />
          ) : (
            <>
              <ul className="divide-y divide-stone-100">
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(contact)}
                      className="flex w-full flex-wrap items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-stone-50/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
                    >
                      <span
                        className={
                          contact.status === "NEW"
                            ? "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
                            : "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500"
                        }
                      >
                        <Mail className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-stone-900">
                            {contact.name}
                          </span>
                          {contact.status === "NEW" ? (
                            <span className="size-1.5 rounded-full bg-amber-500" />
                          ) : null}
                          <span className="text-xs text-stone-400">
                            {contact.email}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-stone-700">
                          {contact.subject}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-stone-500">
                          {contact.message}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1.5">
                        <Badge tone={CONTACT_STATUS_TONES[contact.status]}>
                          {CONTACT_STATUS_LABELS[contact.status]}
                        </Badge>
                        <span className="text-[11px] text-stone-400">
                          {formatDateTime(contact.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {pagination ? (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                  isFetching={contactsQuery.isFetching}
                />
              ) : null}
            </>
          )}
        </Card>
      )}

      {selected ? (
        <Modal
          open
          onClose={() => setSelected(null)}
          title={selected.subject}
          description={`${selected.name} · ${formatDateTime(selected.createdAt)}`}
          footer={
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {selected.status === "NEW" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={updateStatus.isPending}
                    onClick={() => changeStatus(selected, "READ")}
                    leftIcon={<MailOpen className="size-4" aria-hidden="true" />}
                  >
                    Mark read
                  </Button>
                ) : null}
                {selected.status !== "REPLIED" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={updateStatus.isPending}
                    onClick={() => changeStatus(selected, "REPLIED")}
                    leftIcon={<Reply className="size-4" aria-hidden="true" />}
                  >
                    Mark replied
                  </Button>
                ) : null}
                {selected.status !== "ARCHIVED" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={updateStatus.isPending}
                    onClick={() => changeStatus(selected, "ARCHIVED")}
                    leftIcon={<Archive className="size-4" aria-hidden="true" />}
                  >
                    Archive
                  </Button>
                ) : null}
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                leftIcon={<Trash2 className="size-4" aria-hidden="true" />}
              >
                Delete
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={CONTACT_STATUS_TONES[selected.status]}>
                {CONTACT_STATUS_LABELS[selected.status]}
              </Badge>
              <a
                href={`mailto:${selected.email}`}
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                {selected.email}
              </a>
              {selected.phone ? (
                <a
                  href={`tel:${selected.phone}`}
                  className="text-sm text-stone-500 hover:text-stone-800"
                >
                  {selected.phone}
                </a>
              ) : null}
            </div>
            <div className="whitespace-pre-wrap rounded-xl bg-stone-50 px-4 py-3 text-sm leading-relaxed text-stone-700">
              {selected.message}
            </div>
            <p className="text-xs text-stone-400">
              Last updated {formatDateTime(selected.updatedAt)}
            </p>
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete message"
        description="This permanently removes the contact message. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        loading={deleteContact.isPending}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleteContact.isPending) {
            setDeleteOpen(false);
          }
        }}
      />
    </div>
  );
}
