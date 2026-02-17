// node:dns/promises - re-exports the promises API from node:dns
import { promises } from 'node:dns';

export const lookup = promises.lookup;
export const lookupService = promises.lookupService;
export const resolve = promises.resolve;
export const resolve4 = promises.resolve4;
export const resolve6 = promises.resolve6;
export const resolveAny = promises.resolveAny;
export const resolveCname = promises.resolveCname;
export const resolveCaa = promises.resolveCaa;
export const resolveMx = promises.resolveMx;
export const resolveNaptr = promises.resolveNaptr;
export const resolveNs = promises.resolveNs;
export const resolvePtr = promises.resolvePtr;
export const resolveSoa = promises.resolveSoa;
export const resolveSrv = promises.resolveSrv;
export const resolveTxt = promises.resolveTxt;
export const reverse = promises.reverse;
export const setServers = promises.setServers;
export const getServers = promises.getServers;
export const setDefaultResultOrder = promises.setDefaultResultOrder;
export const getDefaultResultOrder = promises.getDefaultResultOrder;
export const Resolver = promises.Resolver;

export default promises;