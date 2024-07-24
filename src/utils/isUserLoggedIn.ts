import { Request } from "express";

const isUserLoggedIn = (req: Request): boolean => {
  const isAuthenticated = req.session?.user?.isAuthenticated ?? false;
  let isLoggedOut = false;

  if (req.cookies?.lo) {
    isLoggedOut = JSON.parse(req.cookies.lo);
  }

  return isAuthenticated && !isLoggedOut;
};

export default isUserLoggedIn;
