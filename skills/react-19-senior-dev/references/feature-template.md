# Feature Template — Full Code Reference

This file contains complete, copy-paste-ready code templates for each layer of a feature. Replace `[Entity]` / `[entity]` / `[entities]` / `[feature]` with your actual names.

---

## Zod Schema (`src/features/[feature]/schemas/[entity].schema.ts`)

```typescript
import { z } from "zod";

export const [entity]Schema = z.object({
  id: z.string(),
  // ... entity fields
  // Server-generated fields must be optional — APIs often omit them on POST responses
  createdAt: z.string().optional(),
});

export type [Entity] = z.infer<typeof [entity]Schema>;

export const [entities]ResponseSchema = z.array([entity]Schema);

export const create[Entity]Schema = z.object({
  // fields with validation messages
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export type Create[Entity]Input = z.infer<typeof create[Entity]Schema>;

// Extend rather than alias — allows fields to diverge (e.g. optional fields on update)
export const update[Entity]Schema = create[Entity]Schema.extend({});
export type Update[Entity]Input = z.infer<typeof update[Entity]Schema>;
```

---

## Service (`src/api/services/[entity].service.ts`)

```typescript
import { apiClient } from "@/api/client/axios.client";
import type { Create[Entity]Input, Update[Entity]Input, [Entity] } from "@/features/[feature]/schemas/[entity].schema";
import { [entity]Schema, [entities]ResponseSchema } from "@/features/[feature]/schemas/[entity].schema";

export const [entity]Service = {
  getAll: async (): Promise<[Entity][]> => {
    const { data } = await apiClient.get<unknown>("/[entities]");
    return [entities]ResponseSchema.parse(data);
  },

  getById: async (id: string): Promise<[Entity]> => {
    const { data } = await apiClient.get<unknown>(`/[entities]/${id}`);
    return [entity]Schema.parse(data);
  },

  create: async (input: Create[Entity]Input): Promise<[Entity]> => {
    const { data } = await apiClient.post<unknown>("/[entities]", input);
    return [entity]Schema.parse(data);
  },

  update: async (id: string, input: Update[Entity]Input): Promise<[Entity]> => {
    const { data } = await apiClient.put<unknown>(`/[entities]/${id}`, input);
    return [entity]Schema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/[entities]/${id}`);
  },
};
```

---

## Query Hooks (`src/api/queries/[entity].query.ts`)

```typescript
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Create[Entity]Input, Update[Entity]Input } from "@/features/[feature]/schemas/[entity].schema";
import { [entity]Service } from "@/api/services/[entity].service";

const QUERY_KEY = ["[entities]"] as const;

export const [entities]QueryOptions = queryOptions({
  queryKey: QUERY_KEY,
  queryFn: [entity]Service.getAll,
});

export const use[Entities]Query = () => useQuery([entities]QueryOptions);

export const useCreate[Entity]Mutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Create[Entity]Input) => [entity]Service.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useUpdate[Entity]Mutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Update[Entity]Input }) =>
      [entity]Service.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useDelete[Entity]Mutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => [entity]Service.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};
```

---

## Page (`src/features/[feature]/pages/[Feature]Page.tsx`)

```typescript
import { useTranslation } from "react-i18next";
import { use[Entities]Query } from "@/api/queries/[entity].query";
import { [Entity]Card } from "@/features/[feature]/components/[Entity]Card";
import { [Entity]Form } from "@/features/[feature]/components/[Entity]Form";

export default function [Feature]Page() {
  const { t } = useTranslation();
  const { data: [entities], isLoading, isError } = use[Entities]Query();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">{t("[feature].title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("[feature].subtitle")}</p>
      </div>

      {isLoading && <p role="status" className="text-muted-foreground">{t("[feature].loading")}</p>}
      {isError && <p role="alert" className="text-destructive">{t("[feature].error")}</p>}
      {[entities]?.length === 0 && (
        <p className="text-muted-foreground">{t("[feature].empty")}</p>
      )}
      {[entities] && [entities].length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[entities].map(([entity]) => (
            <[Entity]Card key={[entity].id} [entity]={[entity]} />
          ))}
        </div>
      )}

      <[Entity]Form />
    </div>
  );
}
```

---

## Card Component (`src/features/[feature]/components/[Entity]Card.tsx`)

```typescript
import { memo, startTransition, useOptimistic, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { useDelete[Entity]Mutation } from "@/api/queries/[entity].query";
import { Edit[Entity]Dialog } from "@/features/[feature]/components/Edit[Entity]Dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { [Entity] } from "@/features/[feature]/schemas/[entity].schema";

interface [Entity]CardProps {
  readonly [entity]: [Entity];
}

export const [Entity]Card = memo(function [Entity]Card({ [entity] }: [Entity]CardProps) {
  const { t } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);
  const delete[Entity] = useDelete[Entity]Mutation();

  const [optimisticDeleted, setOptimisticDeleted] = useOptimistic(
    false,
    (_, deleted: boolean) => deleted
  );

  const handleDelete = () => {
    startTransition(async () => {
      setOptimisticDeleted(true);
      try {
        await delete[Entity].mutateAsync([entity].id);
        toast.success(t("[feature].form.deleteSuccess"));
      } catch {
        toast.error(t("[feature].form.deleteError"));
      }
    });
  };

  if (optimisticDeleted) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle>{[entity].name}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("[feature].form.editLabel")}
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("[feature].form.deleteLabel")}
              onClick={handleDelete}
              disabled={delete[Entity].isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* entity fields */}
        </CardContent>
      </Card>

      <Edit[Entity]Dialog
        [entity]={[entity]}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
});
```

---

## Create Form (`src/features/[feature]/components/[Entity]Form.tsx`)

Uses React 19 `useActionState` — no controlled inputs, form auto-resets on success.

```typescript
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { useCreate[Entity]Mutation } from "@/api/queries/[entity].query";
import { create[Entity]Schema } from "@/features/[feature]/schemas/[entity].schema";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type FormErrors = {
  name?: string[];
  // ... other fields
};

function SubmitButton() {
  const { pending } = useFormStatus();
  const { t } = useTranslation();
  return (
    <Button type="submit" disabled={pending}>
      {t("[feature].form.submit")}
    </Button>
  );
}

export function [Entity]Form() {
  const { t } = useTranslation();
  const create[Entity] = useCreate[Entity]Mutation();

  const [errors, formAction] = useActionState(
    async (_prev: FormErrors, formData: FormData): Promise<FormErrors> => {
      const result = create[Entity]Schema.safeParse(Object.fromEntries(formData));

      if (!result.success) {
        return z.flattenError(result.error).fieldErrors;
      }

      try {
        await create[Entity].mutateAsync(result.data);
        toast.success(t("[feature].form.success"));
        return {};
      } catch {
        toast.error(t("[feature].error"));
        return {};
      }
    },
    {}
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("[feature].form.addTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="create-name">{t("[feature].form.name")}</Label>
            <Input
              id="create-name"
              name="name"
              placeholder={t("[feature].form.namePlaceholder")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{t("[feature].form.nameMin")}</p>
            )}
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## Edit Dialog (`src/features/[feature]/components/Edit[Entity]Dialog.tsx`)

Uses React Hook Form — appropriate for pre-filled, controlled edit forms.

```typescript
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useUpdate[Entity]Mutation } from "@/api/queries/[entity].query";
import {
  update[Entity]Schema,
  type [Entity],
  type Update[Entity]Input,
} from "@/features/[feature]/schemas/[entity].schema";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface Edit[Entity]DialogProps {
  readonly [entity]: [Entity];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function Edit[Entity]Dialog({ [entity], open, onOpenChange }: Edit[Entity]DialogProps) {
  const { t } = useTranslation();
  const update[Entity] = useUpdate[Entity]Mutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Update[Entity]Input>({
    resolver: zodResolver(update[Entity]Schema),
    defaultValues: { name: [entity].name },
  });

  useEffect(() => {
    if (open) reset({ name: [entity].name });
  }, [open, [entity], reset]);

  const onSubmit = async (data: Update[Entity]Input) => {
    try {
      await update[Entity].mutateAsync({ id: [entity].id, input: data });
      toast.success(t("[feature].form.updateSuccess"));
      onOpenChange(false);
    } catch {
      toast.error(t("[feature].form.updateError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("[feature].form.editTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-name">{t("[feature].form.name")}</Label>
            <Input
              id="edit-name"
              placeholder={t("[feature].form.namePlaceholder")}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{t("[feature].form.nameMin")}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("[feature].form.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {t("[feature].form.update")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## MSW Handler (`src/tests/msw/handlers/[entities].ts`)

```typescript
import { http, HttpResponse } from "msw";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const mock[Entities] = [
  { id: "1", name: "Example One" },
  { id: "2", name: "Example Two" },
];

export const [entities]Handlers = [
  http.get(`${API_URL}/[entities]`, () => HttpResponse.json(mock[Entities])),

  http.post(`${API_URL}/[entities]`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: "new-id", ...body }, { status: 201 });
  }),

  http.put(`${API_URL}/[entities]/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: params.id, ...body });
  }),

  http.delete(`${API_URL}/[entities]/:id`, () => new HttpResponse(null, { status: 204 })),
];
```

---

## Page Test (`src/features/[feature]/__tests__/[Feature]Page.test.tsx`)

```typescript
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/tests/test-utils";
import { mock[Entities] } from "@/tests/msw/handlers/[entities]";
import [Feature]Page from "@/features/[feature]/pages/[Feature]Page";

describe("[Feature]Page", () => {
  it("renders the page title", async () => {
    render(<[Feature]Page />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders [entities] after loading", async () => {
    render(<[Feature]Page />);
    await waitFor(() => {
      expect(screen.getByText(mock[Entities][0].name)).toBeInTheDocument();
    });
  });
});
```

---

## Translation Keys Reference

For each entity/feature, generate these keys:

```json
{
  "[feature]": {
    "title": "...",
    "subtitle": "...",
    "loading": "Loading...",
    "error": "Something went wrong.",
    "empty": "No items yet.",
    "form": {
      "addTitle": "Add [Entity]",
      "editTitle": "Edit [Entity]",
      "name": "Name",
      "namePlaceholder": "Enter name",
      "nameMin": "Name must be at least 2 characters",
      "submit": "Add",
      "update": "Save changes",
      "cancel": "Cancel",
      "success": "[Entity] created successfully",
      "updateSuccess": "[Entity] updated successfully",
      "deleteSuccess": "[Entity] deleted successfully",
      "deleteError": "Failed to delete [entity]",
      "updateError": "Failed to update [entity]",
      "editLabel": "Edit [entity]",
      "deleteLabel": "Delete [entity]"
    }
  }
}
```
