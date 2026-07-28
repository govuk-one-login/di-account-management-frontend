import {
  AttributeValue,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { SessionData, Store } from "express-session";

/**
 * DynamoDB-backed express-session store.
 *
 * Wire format is compatible with the now-unmaintained `connect-dynamodb`
 * package it replaces:
 *  - item hash key: `${prefix}${sid}` (default prefix "sess:")
 *  - `sess` (S): JSON-serialised session
 *  - `expires` (N): epoch seconds at which the item is considered expired
 *    and used as the DynamoDB TTL attribute
 */

/** Default session lifetime (seconds) used when a session has no cookie.maxAge. */
const DEFAULT_TTL_SECONDS = 24 * 60 * 60; // one day

export interface DynamoDBSessionStoreOptions {
  /** DynamoDB client used to read/write session items. */
  client: DynamoDBClient;
  /** Name of the DynamoDB table used to store sessions. */
  tableName: string;
  /** Name of the table's hash key attribute. Defaults to "id". */
  hashKey?: string;
  /** Prefix applied to session ids before use as the hash key value. Defaults to "sess:". */
  prefix?: string;
  /** Fallback TTL (seconds) applied when a session has no cookie.maxAge. Defaults to one day. */
  defaultTtlSeconds?: number;
  /**
   * Optional mapper invoked with the session object being written, returning
   * extra DynamoDB attributes to store alongside the session (e.g. a GSI
   * hash key). Returning an empty object omits any extra attributes.
   */
  extraAttributes?: (sess: SessionData) => Record<string, AttributeValue>;
}

export class DynamoDBSessionStore extends Store {
  private readonly client: DynamoDBClient;
  private readonly tableName: string;
  private readonly hashKey: string;
  private readonly prefix: string;
  private readonly defaultTtlSeconds: number;
  private readonly extraAttributes: (
    sess: SessionData
  ) => Record<string, AttributeValue>;

  constructor(options: DynamoDBSessionStoreOptions) {
    super();
    this.client = options.client;
    this.tableName = options.tableName;
    this.hashKey = options.hashKey ?? "id";
    this.prefix = options.prefix ?? "sess:";
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? DEFAULT_TTL_SECONDS;
    this.extraAttributes = options.extraAttributes ?? (() => ({}));
  }

  private key(sid: string): string {
    return `${this.prefix}${sid}`;
  }

  private expiresAt(sess: SessionData): number {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return typeof sess.cookie?.maxAge === "number"
      ? nowInSeconds + Math.floor(sess.cookie.maxAge / 1000)
      : nowInSeconds + this.defaultTtlSeconds;
  }

  get = (
    sid: string,
    callback: (err: any, session?: SessionData | null) => void
  ): void => {
    this.client
      .send(
        new GetItemCommand({
          TableName: this.tableName,
          Key: { [this.hashKey]: { S: this.key(sid) } },
          ConsistentRead: true,
        })
      )
      .then((result) => {
        try {
          callback(null, this.parseSession(result));
        } catch (err) {
          callback(err);
        }
      })
      .catch(callback);
  };

  private parseSession(result: {
    Item?: Record<string, AttributeValue>;
  }): SessionData | null {
    const item = result.Item;
    if (!item?.sess?.S) {
      return null;
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (item.expires?.N && nowInSeconds >= Number(item.expires.N)) {
      return null;
    }

    return JSON.parse(item.sess.S);
  }

  set = (
    sid: string,
    session: SessionData,
    callback?: (err?: any) => void
  ): void => {
    const item: Record<string, AttributeValue> = {
      [this.hashKey]: { S: this.key(sid) },
      expires: { N: String(this.expiresAt(session)) },
      sess: { S: JSON.stringify(session) },
      ...this.extraAttributes(session),
    };

    this.client
      .send(new PutItemCommand({ TableName: this.tableName, Item: item }))
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  };

  destroy = (sid: string, callback?: (err?: any) => void): void => {
    this.client
      .send(
        new DeleteItemCommand({
          TableName: this.tableName,
          Key: { [this.hashKey]: { S: this.key(sid) } },
        })
      )
      .then(() => callback?.())
      .catch((err) => callback?.(err));
  };

  touch = (
    sid: string,
    session: SessionData,
    callback?: (err?: any, data?: { expires: string }) => void
  ): void => {
    const expires = this.expiresAt(session);

    this.client
      .send(
        new UpdateItemCommand({
          TableName: this.tableName,
          Key: { [this.hashKey]: { S: this.key(sid) } },
          UpdateExpression: "set expires = :e",
          ExpressionAttributeValues: { ":e": { N: String(expires) } },
          ReturnValues: "UPDATED_NEW",
        })
      )
      .then((result) => {
        callback?.(null, { expires: result.Attributes?.expires?.N as string });
      })
      .catch((err) => callback?.(err));
  };
}
