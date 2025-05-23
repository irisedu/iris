/**
 * This file was generated by kysely-codegen.
 * Please do not edit it manually.
 */

import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Json = JsonValue;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [x: string]: JsonValue | undefined;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Asset {
  id: string;
  rev: string;
}

export interface AssetPtr {
  asset_id: string;
  path: string;
  project_name: string | null;
  rev: Generated<string>;
}

export interface Assignment {
  data: Json;
  external_id: string;
  user_id: string;
}

export interface AssignmentSubmission {
  created: Generated<Timestamp>;
  external_id: string;
  id: Generated<string>;
  outcome: Json | null;
  submission: Json;
  user_id: string;
}

export interface Document {
  data: Json;
  id: Generated<string>;
  project_name: string | null;
  rev: string;
}

export interface DocumentPtr {
  doc_id: string;
  path: string;
  project_name: string | null;
  rev: Generated<string>;
}

export interface Project {
  name: string;
  rev: string | null;
}

export interface ProjectGroup {
  group_name: string;
  project_name: string;
  user_id: string;
}

export interface QuestionSubmission {
  created: Generated<Timestamp>;
  id: Generated<string>;
  outcome: Json | null;
  question_id: string;
  submission: Json;
  user_id: string;
}

export interface Series {
  data: Json;
  href: string;
  project_name: string | null;
}

export interface UserAccount {
  created: Generated<Timestamp>;
  email: string;
  id: Generated<string>;
  name: string | null;
}

export interface UserFederatedIdentity {
  created: Generated<Timestamp>;
  federated_id: string;
  id: Generated<number>;
  provider: string;
  user_id: string;
}

export interface UserGroup {
  group_name: string;
  user_id: string;
}

export interface DB {
  asset: Asset;
  asset_ptr: AssetPtr;
  assignment: Assignment;
  assignment_submission: AssignmentSubmission;
  document: Document;
  document_ptr: DocumentPtr;
  project: Project;
  project_group: ProjectGroup;
  question_submission: QuestionSubmission;
  series: Series;
  user_account: UserAccount;
  user_federated_identity: UserFederatedIdentity;
  user_group: UserGroup;
}
