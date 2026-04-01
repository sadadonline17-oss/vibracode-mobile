/* eslint-disable */
/**
 * Generated utilities for implementing server-side Convex query and mutation functions.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import {
  ActionBuilder,
  HttpActionBuilder,
  MutationBuilder,
  QueryBuilder,
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from "convex/server";
import type { DataModel } from "./dataModel.js";

/**
 * Define a query in this Convex app's public API.
 *
 * This function is used to define query functions. Similar to Convex's `query`
 * but with a specified data model.
 */
export declare const query: QueryBuilder<DataModel, "public">;

/**
 * Define a query that is only accessible from other Convex functions (not publicly).
 */
export declare const internalQuery: QueryBuilder<DataModel, "internal">;

/**
 * Define a mutation in this Convex app's public API.
 *
 * This function is used to define mutation functions. Similar to Convex's `mutation`
 * but with a specified data model.
 */
export declare const mutation: MutationBuilder<DataModel, "public">;

/**
 * Define a mutation that is only accessible from other Convex functions (not publicly).
 */
export declare const internalMutation: MutationBuilder<DataModel, "internal">;

/**
 * Define an action in this Convex app's public API.
 *
 * This function is used to define action functions. Similar to Convex's `action`
 * but with a specified data model.
 */
export declare const action: ActionBuilder<DataModel, "public">;

/**
 * Define an action that is only accessible from other Convex functions (not publicly).
 */
export declare const internalAction: ActionBuilder<DataModel, "internal">;

/**
 * A type of a Convex query function defined with `query`.
 *
 * @typeParam Args - The type of the query's arguments.
 * @typeParam Output - The type of the query's output.
 */
export type QueryCtx = GenericQueryCtx<DataModel>;

/**
 * A type of a Convex mutation function defined with `mutation`.
 *
 * @typeParam Args - The type of the mutation's arguments.
 * @typeParam Output - The type of the mutation's output.
 */
export type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * A type of a Convex action function defined with `action`.
 *
 * @typeParam Args - The type of the action's arguments.
 * @typeParam Output - The type of the action's output.
 */
export type ActionCtx = GenericActionCtx<DataModel>;

/**
 * An interface to read from the database within a Convex query function.
 *
 * @typeParam DataModel - A type describing your Convex data model.
 */
export type DatabaseReader = GenericDatabaseReader<DataModel>;

/**
 * An interface to read from and write to the database within a Convex
 * mutation function.
 *
 * @typeParam DataModel - A type describing your Convex data model.
 */
export type DatabaseWriter = GenericDatabaseWriter<DataModel>;
