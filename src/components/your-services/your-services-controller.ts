import { Request, Response } from "express";

const accountsList = [
  {
    "client_id": "sub1234",
    "last_accessed": "10 October 2022"
  },
  {
    "client_id": "sub4567",
    "last_accessed": "10 October 2022"
  }
]

const servicesList = [
  {
    "client_id": "sub8910",
    "last_accessed": "10 October 2022"
  },
  {
    "client_id": "sub1112",
    "last_accessed": "10 October 2022"
  }
]

export function yourServicesGet(req: Request, res: Response): void {
  const data = {
    email: req.session.user.email,
    accountsList: accountsList,
    servicesList: servicesList,
  };

  res.render("your-services/index.njk", data);
}
