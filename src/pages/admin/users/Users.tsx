import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Users as UsersIcon,
  User,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  MapPin,
  MessageCircle,
  UserCheck,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { UserService } from "@/lib/services";
import { User as UserType } from "@/types/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ExtendedUser extends UserType {
  age?: number | string;
  current_location?: string;
  academy_name?: string;
  coach_name?: string;
  specialization?: string;
  participate_in_events?: string;
  stroke_best_time?: string;
  how_did_you_know?: string;
  has_whatsapp?: boolean;
}

const Users = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await UserService.getAll();
      
      // Calculate age for each user and sort by created_at (newest first)
      const usersWithAge = fetchedUsers.map(user => {
        let age = "N/A";
        if (user.dob) {
          const birthDate = new Date(user.dob);
          const today = new Date();
          let calculatedAge = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
          }
          age = calculatedAge.toString();
        }
        
        return {
          ...user,
          age
        };
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setUsers(usersWithAge);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error loading users",
        description: "Could not load user data. Please try again later.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };


  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    
    const matchesExperience = experienceFilter === "all" || 
      user.swimming_experience === experienceFilter;
    
    const matchesAdmin = adminFilter === "all" ||
      (adminFilter === "admin" && user.is_admin) ||
      (adminFilter === "customer" && !user.is_admin);
    
    return matchesSearch && matchesExperience && matchesAdmin;
  });

  const getStatusBadge = (user: ExtendedUser) => {
    if (user.is_admin) {
      return <Badge variant="destructive" className="text-xs">Admin</Badge>;
    }
    if (user.is_verified) {
      return <Badge variant="default" className="text-xs bg-green-600">Verified</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Unverified</Badge>;
  };

  const getExperienceBadge = (experience?: string) => {
    if (!experience) return null;
    
    const colors = {
      beginner: "bg-yellow-100 text-yellow-800",
      intermediate: "bg-blue-100 text-blue-800",
      advanced: "bg-green-100 text-green-800"
    };
    
    return (
      <Badge variant="outline" className={`text-xs ${colors[experience as keyof typeof colors] || ""}`}>
        {experience}
      </Badge>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <UsersIcon className="h-8 w-8" />
          Users Management
        </h1>
        <p className="text-muted-foreground">
          View and manage all registered users
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Experience</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={adminFilter} onValueChange={setAdminFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            All registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || experienceFilter !== "all" || adminFilter !== "all"
                  ? "No users match the current filters."
                  : "No users have been registered yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Academy</TableHead>
                    <TableHead>Coach</TableHead>
                    <TableHead>Best Time</TableHead>
                    <TableHead>Competes</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Found Via</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-accent/5">
                      {/* Name */}
                      <TableCell>
                        <div className="font-medium">{user.name}</div>
                      </TableCell>
                      
                      {/* Email */}
                      <TableCell>
                        <div className="text-sm">{user.email}</div>
                      </TableCell>
                      
                      {/* Phone */}
                      <TableCell>
                        <div className="text-sm">{user.phone}</div>
                      </TableCell>
                      
                      {/* Location */}
                      <TableCell>
                        <div className="text-sm">{user.current_location || "N/A"}</div>
                      </TableCell>
                      
                      {/* Age */}
                      <TableCell>
                        <div className="text-sm">{user.age !== "N/A" ? `${user.age}` : "N/A"}</div>
                      </TableCell>
                      
                      {/* Gender */}
                      <TableCell>
                        <div className="text-sm capitalize">{user.gender || "N/A"}</div>
                      </TableCell>
                      
                      {/* Experience */}
                      <TableCell>
                        {user.swimming_experience ? getExperienceBadge(user.swimming_experience) : "N/A"}
                      </TableCell>
                      
                      {/* Specialization */}
                      <TableCell>
                        <div className="text-sm capitalize">{user.specialization || "N/A"}</div>
                      </TableCell>
                      
                      {/* Academy */}
                      <TableCell>
                        <div className="text-sm">{user.academy_name && user.academy_name !== "NA" ? user.academy_name : "N/A"}</div>
                      </TableCell>
                      
                      {/* Coach */}
                      <TableCell>
                        <div className="text-sm">{user.coach_name || "N/A"}</div>
                      </TableCell>
                      
                      {/* Best Time */}
                      <TableCell>
                        <div className="text-sm">{user.stroke_best_time || "N/A"}</div>
                      </TableCell>
                      
                      {/* Competes */}
                      <TableCell>
                        {user.participate_in_events ? (
                          user.participate_in_events === "yes" ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-sm">Yes</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <XCircle className="h-3 w-3" />
                              <span className="text-sm">No</span>
                            </div>
                          )
                        ) : "N/A"}
                      </TableCell>
                      
                      {/* WhatsApp */}
                      <TableCell>
                        {user.has_whatsapp !== undefined ? (
                          user.has_whatsapp ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <MessageCircle className="h-3 w-3" />
                              <span className="text-sm">Yes</span>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No</div>
                          )
                        ) : "N/A"}
                      </TableCell>
                      
                      {/* Found Via */}
                      <TableCell>
                        <div className="text-sm capitalize">{user.how_did_you_know || "N/A"}</div>
                      </TableCell>
                      
                      {/* Status */}
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(user)}
                          {user.is_admin && (
                            <div>
                              <Badge variant="destructive" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Joined */}
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(user.created_at), "MMM d, yyyy")}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(user.created_at), "h:mm a")}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default Users;
