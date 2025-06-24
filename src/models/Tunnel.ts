import { Model } from '@untangled/connectors/mongo';
import mongoose from 'mongoose';

const Address = new mongoose.Schema({
  /**
   * A unique name for the address.
   */
  alias: String,
  /**
   * Host of the address.
   */
  host: String,
  /**
   * Port of the address.
   */
  port: Number,
});

const Tunnel = new mongoose.Schema({
  /**
   * SSH username.
   */
  username: String,
  /**
   * SSH password.
   */
  password: String,
  /**
   * SSH authorized keys.
   */
  authorizedKeys: Array(String),
  /**
   * Allowed addresses for local port forwarding,
   */
  accesses: Array(Address),
  /**
   * Allowed addresses for remote port forwarding.
   */
  binds: Array(Address),
});

/**
 * Contains users' permissions for tunneling.
 */
export default Model('Tunnel', Tunnel);
