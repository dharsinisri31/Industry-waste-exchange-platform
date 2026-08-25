import math
import importlib

routing_enums_pb2 = None
pywrapcp = None
HAS_ORTOOLS = False

try:
    routing_enums_pb2 = importlib.import_module("ortools.constraint_solver.routing_enums_pb2")
    pywrapcp = importlib.import_module("ortools.constraint_solver.pywrapcp")
    HAS_ORTOOLS = True
except Exception:
    HAS_ORTOOLS = False

class RouteService:
    def calculate_distance(self, p1, p2):
        lon1, lat1 = p1
        lon2, lat2 = p2
        R = 6371
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (math.sin(d_lat / 2) * math.sin(d_lat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(d_lon / 2) * math.sin(d_lon / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def optimize_route(self, coordinates: list) -> dict:
        n = len(coordinates)
        if n <= 1:
            return {"optimalOrder": [0], "totalDistanceKm": 0.0, "transportCost": 0.0}
            
        if HAS_ORTOOLS and pywrapcp and routing_enums_pb2:
            try:
                # Distance matrix multiplied by 100 to convert to integers for OR-Tools solver
                distance_matrix = []
                for i in range(n):
                    row = []
                    for j in range(n):
                        dist = self.calculate_distance(coordinates[i], coordinates[j])
                        row.append(int(dist * 100))
                    distance_matrix.append(row)
                    
                manager = pywrapcp.RoutingIndexManager(n, 1, 0)
                routing = pywrapcp.RoutingModel(manager)
                
                def distance_callback(from_index, to_index):
                    from_node = manager.IndexToNode(from_index)
                    to_node = manager.IndexToNode(to_index)
                    return distance_matrix[from_node][to_node]
                    
                transit_callback_index = routing.RegisterTransitCallback(distance_callback)
                routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
                
                search_parameters = pywrapcp.DefaultRoutingSearchParameters()
                search_parameters.first_solution_strategy = (
                    routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
                )
                
                solution = routing.SolveWithParameters(search_parameters)
                
                if solution:
                    index = routing.Start(0)
                    optimal_order = []
                    total_dist = 0
                    while not routing.IsEnd(index):
                        node = manager.IndexToNode(index)
                        optimal_order.append(node)
                        previous_index = index
                        index = solution.Value(routing.NextVar(index))
                        total_dist += routing.GetArcCostForVehicle(previous_index, index, 0)
                        
                    total_dist_km = float(total_dist / 100.0)
                    return {
                        "optimalOrder": optimal_order,
                        "totalDistanceKm": round(total_dist_km, 2),
                        "transportCost": round(total_dist_km * 1.5, 2)
                    }
            except Exception as e:
                print(f"[Route Service] OR-Tools routing error ({e}). Using Haversine sequential mapping.")
            
        # Fallback Haversine sequential route solver
        total_dist = 0.0
        for i in range(n - 1):
            total_dist += self.calculate_distance(coordinates[i], coordinates[i+1])
        return {
            "optimalOrder": list(range(n)),
            "totalDistanceKm": round(total_dist, 2),
            "transportCost": round(total_dist * 1.5, 2)
        }

route_service = RouteService()
